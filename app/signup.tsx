import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { signup } from '../lib/api';
import { theme } from '../lib/theme';

type FormFields = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

type FormErrors = Partial<Record<keyof FormFields, string>>;

function validate(fields: FormFields): FormErrors {
  const errors: FormErrors = {};

  if (!fields.fullName.trim()) {
    errors.fullName = 'Full name is required.';
  }

  if (!fields.email.trim()) {
    errors.email = 'Email is required.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) {
    errors.email = 'Enter a valid email address.';
  }

  if (!fields.password) {
    errors.password = 'Password is required.';
  } else if (fields.password.length < 8) {
    errors.password = 'Password must be at least 8 characters.';
  }

  if (!fields.confirmPassword) {
    errors.confirmPassword = 'Please confirm your password.';
  } else if (fields.confirmPassword !== fields.password) {
    errors.confirmPassword = 'Passwords do not match.';
  }

  return errors;
}

export default function SignupScreen() {
  const router = useRouter();

  const [fields, setFields] = useState<FormFields>({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  function setField(key: keyof FormFields, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  }

  async function handleSubmit() {
    const validationErrors = validate(fields);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    setApiError(null);

    try {
      const res = await signup({
        first_name: fields.fullName.trim(),
        email: fields.email.trim().toLowerCase(),
        password: fields.password,
        profile_type: 'Worker',
      });

      if (res.code === 200) {
        router.replace('/(tabs)/home');
      } else {
        setApiError(res.message ?? 'Something went wrong. Please try again.');
      }
    } catch {
      setApiError('Could not connect. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bgBase }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back arrow */}
          <Pressable
            onPress={() => router.back()}
            hitSlop={16}
            style={{ marginTop: 16, marginBottom: 28, alignSelf: 'flex-start' }}
          >
            <Text
              style={{
                fontSize: 24,
                color: theme.colors.textPrimary,
                lineHeight: 28,
              }}
            >
              ←
            </Text>
          </Pressable>

          {/* Heading */}
          <Text
            style={{
              fontFamily: theme.typography.fontDisplay,
              fontSize: 28,
              color: theme.colors.textPrimary,
              marginBottom: 32,
              letterSpacing: -0.5,
            }}
          >
            Create account
          </Text>

          {/* API-level error */}
          {apiError !== null && (
            <View
              style={{
                backgroundColor: theme.colors.redDim,
                borderRadius: theme.radius.md,
                paddingHorizontal: 14,
                paddingVertical: 10,
                marginBottom: 20,
                borderWidth: 1,
                borderColor: theme.colors.red,
              }}
            >
              <Text
                style={{
                  fontFamily: theme.typography.fontBody,
                  fontSize: 14,
                  color: theme.colors.red,
                }}
              >
                {apiError}
              </Text>
            </View>
          )}

          {/* Form */}
          <View style={{ gap: 14 }}>
            <Field
              label="Full name"
              value={fields.fullName}
              onChangeText={(v) => setField('fullName', v)}
              error={errors.fullName}
              autoCapitalize="words"
              autoComplete="name"
              returnKeyType="next"
            />

            <Field
              label="Email"
              value={fields.email}
              onChangeText={(v) => setField('email', v)}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              returnKeyType="next"
            />

            <Field
              label="Password"
              value={fields.password}
              onChangeText={(v) => setField('password', v)}
              error={errors.password}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              returnKeyType="next"
              rightAction={
                <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
                  <Text
                    style={{
                      fontFamily: theme.typography.fontBodyMedium,
                      fontSize: 13,
                      color: theme.colors.blue,
                    }}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </Text>
                </Pressable>
              }
            />

            <Field
              label="Confirm password"
              value={fields.confirmPassword}
              onChangeText={(v) => setField('confirmPassword', v)}
              error={errors.confirmPassword}
              secureTextEntry={!showConfirm}
              autoCapitalize="none"
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
              rightAction={
                <Pressable onPress={() => setShowConfirm((v) => !v)} hitSlop={8}>
                  <Text
                    style={{
                      fontFamily: theme.typography.fontBodyMedium,
                      fontSize: 13,
                      color: theme.colors.blue,
                    }}
                  >
                    {showConfirm ? 'Hide' : 'Show'}
                  </Text>
                </Pressable>
              }
            />
          </View>

          <View style={{ flex: 1, minHeight: 40 }} />

          {/* Submit button */}
          <Pressable
            onPress={handleSubmit}
            disabled={loading}
            style={({ pressed }) => ({
              height: 52,
              backgroundColor:
                loading || pressed ? theme.colors.blueGlow : theme.colors.blue,
              borderRadius: theme.radius.xl,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
              opacity: loading ? 0.7 : 1,
            })}
          >
            {loading ? (
              <ActivityIndicator color={theme.colors.bgBase} />
            ) : (
              <Text
                style={{
                  fontFamily: theme.typography.fontBodySemiBold,
                  fontSize: 16,
                  color: theme.colors.bgBase,
                }}
              >
                Create Account
              </Text>
            )}
          </Pressable>

          {/* Login link */}
          <Pressable
            onPress={() => router.replace('/login')}
            style={{ alignItems: 'center', marginBottom: 32 }}
          >
            <Text
              style={{
                fontFamily: theme.typography.fontBody,
                fontSize: 14,
                color: theme.colors.textSecondary,
              }}
            >
              Already have an account?{' '}
              <Text
                style={{
                  fontFamily: theme.typography.fontBodySemiBold,
                  color: theme.colors.blue,
                }}
              >
                Log in
              </Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Field component ───────────────────────────────────────────────────────────

type FieldProps = {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  error?: string;
  rightAction?: React.ReactNode;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address';
  autoCapitalize?: 'none' | 'words' | 'sentences' | 'characters';
  autoComplete?: 'name' | 'email' | 'password' | 'off';
  returnKeyType?: 'next' | 'done';
  onSubmitEditing?: () => void;
};

function Field({
  label,
  value,
  onChangeText,
  error,
  rightAction,
  ...inputProps
}: FieldProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View>
      <View
        style={{
          height: 52,
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: theme.colors.bgCard,
          borderRadius: theme.radius.md,
          borderWidth: 1,
          borderColor: error
            ? theme.colors.red
            : focused
              ? theme.colors.borderActive
              : theme.colors.border,
          paddingHorizontal: 14,
        }}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={label}
          placeholderTextColor={theme.colors.textMuted}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            flex: 1,
            fontFamily: theme.typography.fontBody,
            fontSize: 15,
            color: theme.colors.textPrimary,
            height: '100%',
          }}
          {...inputProps}
        />
        {rightAction}
      </View>

      {error !== undefined && (
        <Text
          style={{
            fontFamily: theme.typography.fontBody,
            fontSize: 12,
            color: theme.colors.red,
            marginTop: 4,
            marginLeft: 4,
          }}
        >
          {error}
        </Text>
      )}
    </View>
  );
}
