import { useQuery } from '@tanstack/react-query';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { addJob, getCategoriesListing } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { theme } from '../lib/theme';

// ── Types ─────────────────────────────────────────────────────────────────────

type BudgetType = 'fixed' | 'hourly';
type Urgency = 'flexible' | 'asap';

type FormState = {
  title: string;
  categoryId: string;
  description: string;
  address: string;
  longitude: number;
  latitude: number;
  budgetType: BudgetType;
  amount: string;
  date: Date | null;
  urgency: Urgency;
};

type StepErrors = Partial<Record<keyof FormState, string>>;

// ── Helpers ───────────────────────────────────────────────────────────────────

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const;

const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] as const;

function formatDate(d: Date): string {
  return `${MONTHS[d.getMonth()].slice(0, 3)} ${d.getDate()}, ${d.getFullYear()}`;
}

function toISODate(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

function buildCalendarGrid(year: number, month: number): (number | null)[][] {
  const firstDay = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const grid: (number | null)[][] = [];
  let row: (number | null)[] = new Array<null>(firstDay).fill(null);
  for (let d = 1; d <= totalDays; d++) {
    row.push(d);
    if (row.length === 7) { grid.push(row); row = []; }
  }
  if (row.length > 0) {
    while (row.length < 7) row.push(null);
    grid.push(row);
  }
  return grid;
}

function validateStep1(f: FormState): StepErrors {
  const e: StepErrors = {};
  if (!f.title.trim()) e.title = 'Job title is required.';
  if (!f.categoryId) e.categoryId = 'Select a category.';
  if (f.description.trim().length < 20) e.description = 'Description must be at least 20 characters.';
  if (!f.address.trim()) e.address = 'Location is required.';
  return e;
}

function validateStep2(f: FormState): StepErrors {
  const e: StepErrors = {};
  const amt = parseFloat(f.amount);
  if (!f.amount.trim() || isNaN(amt) || amt <= 0) e.amount = 'Enter a valid budget amount.';
  if (!f.date) e.date = 'Select a date.';
  return e;
}

// ── Step indicator ────────────────────────────────────────────────────────────

function StepIndicator({ step }: { step: 1 | 2 | 3 }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 28 }}>
      {([1, 2, 3] as const).map((n) => (
        <View
          key={n}
          style={{
            width: n === step ? 24 : 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: n === step ? theme.colors.blue : n < step ? theme.colors.blueGlow : theme.colors.bgElevated,
          }}
        />
      ))}
    </View>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────────

type ToastProps = { message: string; type: 'success' | 'error'; visible: boolean };

function Toast({ message, type, visible }: ToastProps) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.delay(1800),
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, opacity]);

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: 60,
        left: 20,
        right: 20,
        opacity,
        zIndex: 999,
        backgroundColor: type === 'success' ? theme.colors.greenDim : theme.colors.redDim,
        borderWidth: 1,
        borderColor: type === 'success' ? theme.colors.green : theme.colors.red,
        borderRadius: theme.radius.md,
        paddingHorizontal: 16,
        paddingVertical: 12,
      }}
    >
      <Text
        style={{
          fontFamily: theme.typography.fontBodyMedium,
          fontSize: 14,
          color: type === 'success' ? theme.colors.green : theme.colors.red,
          textAlign: 'center',
        }}
      >
        {message}
      </Text>
    </Animated.View>
  );
}

// ── Reusable field ────────────────────────────────────────────────────────────

type FieldProps = {
  label: string;
  error?: string;
  children: React.ReactNode;
};

function Field({ label, error, children }: FieldProps) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text
        style={{
          fontFamily: theme.typography.fontBodyMedium,
          fontSize: 13,
          color: theme.colors.textSecondary,
          marginBottom: 6,
        }}
      >
        {label}
      </Text>
      {children}
      {error !== undefined && (
        <Text
          style={{
            fontFamily: theme.typography.fontBody,
            fontSize: 12,
            color: theme.colors.red,
            marginTop: 4,
          }}
        >
          {error}
        </Text>
      )}
    </View>
  );
}

type StyledInputProps = {
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  numberOfLines?: number;
  keyboardType?: 'default' | 'numeric' | 'decimal-pad';
  hasError?: boolean;
  prefix?: string;
};

function StyledInput({
  value,
  onChangeText,
  placeholder,
  multiline,
  numberOfLines = 1,
  keyboardType = 'default',
  hasError,
  prefix,
}: StyledInputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: multiline ? 'flex-start' : 'center',
        backgroundColor: theme.colors.bgCard,
        borderRadius: theme.radius.md,
        borderWidth: 1,
        borderColor: hasError
          ? theme.colors.red
          : focused
            ? theme.colors.borderActive
            : theme.colors.border,
        paddingHorizontal: 14,
        paddingVertical: multiline ? 12 : 0,
        minHeight: multiline ? numberOfLines * 24 + 24 : 52,
      }}
    >
      {prefix !== undefined && (
        <Text
          style={{
            fontFamily: theme.typography.fontBodyMedium,
            fontSize: 16,
            color: theme.colors.textMuted,
            marginRight: 4,
            paddingTop: multiline ? 0 : 0,
          }}
        >
          {prefix}
        </Text>
      )}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textMuted}
        multiline={multiline}
        numberOfLines={multiline ? numberOfLines : undefined}
        keyboardType={keyboardType}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        textAlignVertical={multiline ? 'top' : 'center'}
        style={{
          flex: 1,
          fontFamily: theme.typography.fontBody,
          fontSize: 15,
          color: theme.colors.textPrimary,
          minHeight: multiline ? numberOfLines * 24 : 52,
        }}
      />
    </View>
  );
}

// ── Toggle (segmented control) ────────────────────────────────────────────────

type ToggleProps<T extends string> = {
  options: { label: string; value: T }[];
  value: T;
  onChange: (v: T) => void;
};

function Toggle<T extends string>({ options, value, onChange }: ToggleProps<T>) {
  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: theme.colors.bgCard,
        borderRadius: theme.radius.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
        overflow: 'hidden',
      }}
    >
      {options.map((opt, i) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={{
              flex: 1,
              paddingVertical: 12,
              alignItems: 'center',
              backgroundColor: active ? theme.colors.blue : 'transparent',
              borderLeftWidth: i > 0 ? 1 : 0,
              borderColor: theme.colors.border,
            }}
          >
            <Text
              style={{
                fontFamily: theme.typography.fontBodySemiBold,
                fontSize: 14,
                color: active ? theme.colors.bgBase : theme.colors.textSecondary,
              }}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ── Calendar picker modal ─────────────────────────────────────────────────────

type CalendarProps = {
  visible: boolean;
  selected: Date | null;
  onSelect: (d: Date) => void;
  onClose: () => void;
};

function CalendarPicker({ visible, selected, onSelect, onClose }: CalendarProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  }

  function isPast(day: number): boolean {
    return new Date(viewYear, viewMonth, day) < today;
  }

  function isSelectedDay(day: number): boolean {
    if (!selected) return false;
    return (
      selected.getFullYear() === viewYear &&
      selected.getMonth() === viewMonth &&
      selected.getDate() === day
    );
  }

  function isTodayDay(day: number): boolean {
    return (
      today.getFullYear() === viewYear &&
      today.getMonth() === viewMonth &&
      today.getDate() === day
    );
  }

  const grid = buildCalendarGrid(viewYear, viewMonth);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' }}
        onPress={onClose}
      >
        <Pressable
          style={{
            width: 320,
            backgroundColor: theme.colors.bgSurface,
            borderRadius: theme.radius.lg,
            borderWidth: 1,
            borderColor: theme.colors.border,
            padding: 20,
          }}
          onPress={() => {}}
        >
          {/* Month/year nav */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <Pressable onPress={prevMonth} hitSlop={12}>
              <Text style={{ fontSize: 20, color: theme.colors.textSecondary }}>‹</Text>
            </Pressable>
            <Text style={{ fontFamily: theme.typography.fontBodySemiBold, fontSize: 15, color: theme.colors.textPrimary }}>
              {MONTHS[viewMonth]} {viewYear}
            </Text>
            <Pressable onPress={nextMonth} hitSlop={12}>
              <Text style={{ fontSize: 20, color: theme.colors.textSecondary }}>›</Text>
            </Pressable>
          </View>

          {/* Day labels */}
          <View style={{ flexDirection: 'row', marginBottom: 8 }}>
            {DAY_LABELS.map((d) => (
              <Text
                key={d}
                style={{
                  flex: 1,
                  textAlign: 'center',
                  fontFamily: theme.typography.fontBodyMedium,
                  fontSize: 11,
                  color: theme.colors.textMuted,
                }}
              >
                {d}
              </Text>
            ))}
          </View>

          {/* Day grid */}
          {grid.map((row, ri) => (
            <View key={ri} style={{ flexDirection: 'row', marginBottom: 4 }}>
              {row.map((day, ci) => {
                if (day === null) return <View key={ci} style={{ flex: 1 }} />;
                const past = isPast(day);
                const sel = isSelectedDay(day);
                const tod = isTodayDay(day);
                return (
                  <Pressable
                    key={ci}
                    onPress={() => {
                      if (!past) {
                        onSelect(new Date(viewYear, viewMonth, day));
                        onClose();
                      }
                    }}
                    style={{
                      flex: 1,
                      aspectRatio: 1,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 100,
                      backgroundColor: sel ? theme.colors.blue : 'transparent',
                      borderWidth: tod && !sel ? 1 : 0,
                      borderColor: theme.colors.borderActive,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: theme.typography.fontBodyMedium,
                        fontSize: 13,
                        color: sel
                          ? theme.colors.bgBase
                          : past
                            ? theme.colors.textMuted
                            : theme.colors.textPrimary,
                      }}
                    >
                      {day}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ))}

          <Pressable onPress={onClose} style={{ alignItems: 'center', marginTop: 12 }}>
            <Text style={{ fontFamily: theme.typography.fontBodyMedium, fontSize: 13, color: theme.colors.textMuted }}>
              Cancel
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ── Step 1 ────────────────────────────────────────────────────────────────────

type StepProps = {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  errors: StepErrors;
};

function Step1({ form, setForm, errors }: StepProps) {
  const { token } = useAuthStore();
  const [locating, setLocating] = useState(false);

  const { data: catData, isLoading: catsLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => getCategoriesListing(token ?? ''),
    enabled: token !== null,
  });
  const categories = catData?.data ?? [];

  async function autofillLocation() {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const [geo] = await Location.reverseGeocodeAsync({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      const address = [geo?.street, geo?.city, geo?.region].filter(Boolean).join(', ');
      setForm((prev) => ({
        ...prev,
        address: address || '',
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      }));
    } finally {
      setLocating(false);
    }
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <Text style={{ fontFamily: theme.typography.fontDisplay, fontSize: 24, color: theme.colors.textPrimary, marginBottom: 24 }}>
        Job details
      </Text>

      <Field label="Job title" error={errors.title}>
        <StyledInput
          value={form.title}
          onChangeText={(v) => setForm((p) => ({ ...p, title: v }))}
          placeholder="e.g. Help moving furniture"
          hasError={!!errors.title}
        />
      </Field>

      <Field label="Category" error={errors.categoryId}>
        {catsLoading ? (
          <ActivityIndicator color={theme.colors.blue} style={{ marginVertical: 12 }} />
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {categories.map((cat) => {
              const active = form.categoryId === String(cat.id);
              const icon = cat.icon.length <= 2 ? cat.icon : null;
              return (
                <Pressable
                  key={cat.id}
                  onPress={() => setForm((p) => ({ ...p, categoryId: String(cat.id) }))}
                  style={{
                    width: '30%',
                    paddingVertical: 14,
                    alignItems: 'center',
                    gap: 6,
                    backgroundColor: active ? theme.colors.blueDim : theme.colors.bgCard,
                    borderRadius: theme.radius.md,
                    borderWidth: 1,
                    borderColor: active ? theme.colors.borderActive : theme.colors.border,
                  }}
                >
                  {icon !== null && <Text style={{ fontSize: 22 }}>{icon}</Text>}
                  <Text
                    style={{
                      fontFamily: theme.typography.fontBodyMedium,
                      fontSize: 12,
                      color: active ? theme.colors.blue : theme.colors.textSecondary,
                      textAlign: 'center',
                    }}
                    numberOfLines={1}
                  >
                    {cat.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </Field>

      <Field label="Description" error={errors.description}>
        <StyledInput
          value={form.description}
          onChangeText={(v) => setForm((p) => ({ ...p, description: v }))}
          placeholder="Describe the job in detail…"
          multiline
          numberOfLines={4}
          hasError={!!errors.description}
        />
      </Field>

      <Field label="Location" error={errors.address}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1 }}>
            <StyledInput
              value={form.address}
              onChangeText={(v) => setForm((p) => ({ ...p, address: v }))}
              placeholder="Address or area"
              hasError={!!errors.address}
            />
          </View>
          <Pressable
            onPress={autofillLocation}
            style={{
              height: 52,
              paddingHorizontal: 14,
              backgroundColor: theme.colors.bgCard,
              borderRadius: theme.radius.md,
              borderWidth: 1,
              borderColor: theme.colors.border,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {locating ? (
              <ActivityIndicator color={theme.colors.blue} size="small" />
            ) : (
              <Text style={{ fontSize: 18 }}>⌖</Text>
            )}
          </Pressable>
        </View>
      </Field>
    </ScrollView>
  );
}

// ── Step 2 ────────────────────────────────────────────────────────────────────

function Step2({ form, setForm, errors }: StepProps) {
  const [calendarOpen, setCalendarOpen] = useState(false);

  return (
    <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <Text style={{ fontFamily: theme.typography.fontDisplay, fontSize: 24, color: theme.colors.textPrimary, marginBottom: 24 }}>
        Budget & timing
      </Text>

      <Field label="Budget type">
        <Toggle
          options={[
            { label: 'Fixed Price', value: 'fixed' as BudgetType },
            { label: 'Hourly', value: 'hourly' as BudgetType },
          ]}
          value={form.budgetType}
          onChange={(v) => setForm((p) => ({ ...p, budgetType: v }))}
        />
      </Field>

      <Field label={form.budgetType === 'hourly' ? 'Hourly rate' : 'Budget amount'} error={errors.amount}>
        <StyledInput
          value={form.amount}
          onChangeText={(v) => setForm((p) => ({ ...p, amount: v }))}
          placeholder={form.budgetType === 'hourly' ? '0' : '0'}
          keyboardType="decimal-pad"
          prefix="$"
          hasError={!!errors.amount}
        />
      </Field>

      <Field label="Needed by" error={errors.date}>
        <Pressable
          onPress={() => setCalendarOpen(true)}
          style={{
            height: 52,
            backgroundColor: theme.colors.bgCard,
            borderRadius: theme.radius.md,
            borderWidth: 1,
            borderColor: errors.date ? theme.colors.red : theme.colors.border,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 14,
            justifyContent: 'space-between',
          }}
        >
          <Text
            style={{
              fontFamily: theme.typography.fontBody,
              fontSize: 15,
              color: form.date ? theme.colors.textPrimary : theme.colors.textMuted,
            }}
          >
            {form.date ? formatDate(form.date) : 'Select a date'}
          </Text>
          <Text style={{ fontSize: 16, color: theme.colors.textMuted }}>▾</Text>
        </Pressable>
        <CalendarPicker
          visible={calendarOpen}
          selected={form.date}
          onSelect={(d) => setForm((p) => ({ ...p, date: d }))}
          onClose={() => setCalendarOpen(false)}
        />
      </Field>

      <Field label="Urgency">
        <Toggle
          options={[
            { label: 'Flexible', value: 'flexible' as Urgency },
            { label: 'ASAP', value: 'asap' as Urgency },
          ]}
          value={form.urgency}
          onChange={(v) => setForm((p) => ({ ...p, urgency: v }))}
        />
      </Field>
    </ScrollView>
  );
}

// ── Step 3 — Confirm ──────────────────────────────────────────────────────────

type Step3Props = {
  form: FormState;
  loading: boolean;
  onPost: () => void;
};

function Step3({ form, loading, onPost }: Step3Props) {
  const rows: { label: string; value: string }[] = [
    { label: 'Title', value: form.title },
    { label: 'Description', value: form.description.slice(0, 80) + (form.description.length > 80 ? '…' : '') },
    { label: 'Budget', value: `$${form.amount} ${form.budgetType === 'hourly' ? '/hr' : '(fixed)'}` },
    { label: 'Date needed', value: form.date ? formatDate(form.date) : '—' },
    { label: 'Urgency', value: form.urgency === 'asap' ? 'ASAP' : 'Flexible' },
    { label: 'Location', value: form.address },
  ];

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Text style={{ fontFamily: theme.typography.fontDisplay, fontSize: 24, color: theme.colors.textPrimary, marginBottom: 24 }}>
        Review & post
      </Text>

      <View
        style={{
          backgroundColor: theme.colors.bgCard,
          borderRadius: theme.radius.lg,
          borderWidth: 1,
          borderColor: theme.colors.border,
          overflow: 'hidden',
          marginBottom: 28,
        }}
      >
        {rows.map((row, i) => (
          <View
            key={row.label}
            style={{
              flexDirection: 'row',
              paddingHorizontal: 16,
              paddingVertical: 14,
              borderTopWidth: i > 0 ? 1 : 0,
              borderColor: theme.colors.border,
              gap: 12,
            }}
          >
            <Text
              style={{
                fontFamily: theme.typography.fontBodyMedium,
                fontSize: 13,
                color: theme.colors.textMuted,
                width: 90,
                flexShrink: 0,
              }}
            >
              {row.label}
            </Text>
            <Text
              style={{
                fontFamily: theme.typography.fontBody,
                fontSize: 13,
                color: theme.colors.textPrimary,
                flex: 1,
              }}
            >
              {row.value}
            </Text>
          </View>
        ))}
      </View>

      <Pressable
        onPress={onPost}
        disabled={loading}
        style={({ pressed }) => ({
          height: 52,
          backgroundColor: loading || pressed ? theme.colors.blueGlow : theme.colors.blue,
          borderRadius: theme.radius.xl,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: loading ? 0.75 : 1,
        })}
      >
        {loading ? (
          <ActivityIndicator color={theme.colors.bgBase} />
        ) : (
          <Text style={{ fontFamily: theme.typography.fontBodySemiBold, fontSize: 16, color: theme.colors.bgBase }}>
            Post Job
          </Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

const EMPTY_FORM: FormState = {
  title: '',
  categoryId: '',
  description: '',
  address: '',
  longitude: 0,
  latitude: 0,
  budgetType: 'fixed',
  amount: '',
  date: null,
  urgency: 'flexible',
};

export default function PostJobScreen() {
  const router = useRouter();
  const { token } = useAuthStore();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<StepErrors>({});
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error'; key: number } | null>(null);

  function showToast(message: string, type: 'success' | 'error') {
    setToast({ message, type, key: Date.now() });
  }

  function advanceStep() {
    if (step === 1) {
      const e = validateStep1(form);
      if (Object.keys(e).length > 0) { setErrors(e); return; }
      setErrors({});
      setStep(2);
    } else if (step === 2) {
      const e = validateStep2(form);
      if (Object.keys(e).length > 0) { setErrors(e); return; }
      setErrors({});
      setStep(3);
    }
  }

  function goBack() {
    if (step === 1) router.back();
    else if (step === 2) setStep(1);
    else setStep(2);
  }

  async function handlePost() {
    if (!token) return;
    const amount = parseFloat(form.amount);

    setLoading(true);
    try {
      const res = await addJob(
        {
          title: form.title.trim(),
          description: form.description.trim(),
          category_id: form.categoryId,
          price: amount,
          min_bids: amount,
          max_bids: amount,
          is_bids_more: false,
          jobs_date: toISODate(form.date!),
          jobs_time: form.urgency === 'asap' ? 'ASAP' : 'Flexible',
          longitude: form.longitude,
          latitude: form.latitude,
          address: form.address.trim(),
        },
        token,
      );

      if (res.code === 200) {
        showToast('Job posted successfully!', 'success');
        setTimeout(() => router.replace('/(tabs)/home'), 2500);
      } else {
        showToast(res.message ?? 'Something went wrong. Try again.', 'error');
      }
    } catch {
      showToast('Could not connect. Check your connection.', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bgBase }}>
      {toast !== null && (
        <Toast key={toast.key} message={toast.message} type={toast.type} visible />
      )}

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: 8,
          }}
        >
          <Pressable onPress={goBack} hitSlop={16} style={{ marginRight: 12 }}>
            <Text style={{ fontSize: 22, color: theme.colors.textPrimary }}>←</Text>
          </Pressable>
          <Text
            style={{
              fontFamily: theme.typography.fontBodySemiBold,
              fontSize: 16,
              color: theme.colors.textSecondary,
              flex: 1,
            }}
          >
            Post a Job
          </Text>
        </View>

        <View style={{ paddingHorizontal: 20, flex: 1 }}>
          <StepIndicator step={step} />

          <View style={{ flex: 1 }}>
            {step === 1 && <Step1 form={form} setForm={setForm} errors={errors} />}
            {step === 2 && <Step2 form={form} setForm={setForm} errors={errors} />}
            {step === 3 && <Step3 form={form} loading={loading} onPost={handlePost} />}
          </View>

          {/* Next button for steps 1 + 2 */}
          {step !== 3 && (
            <Pressable
              onPress={advanceStep}
              style={({ pressed }) => ({
                height: 52,
                backgroundColor: pressed ? theme.colors.blueGlow : theme.colors.blue,
                borderRadius: theme.radius.xl,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
                marginTop: 8,
              })}
            >
              <Text style={{ fontFamily: theme.typography.fontBodySemiBold, fontSize: 16, color: theme.colors.bgBase }}>
                {step === 1 ? 'Next — Budget & Timing' : 'Next — Review'}
              </Text>
            </Pressable>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
