import { useRouter } from 'expo-router';
import { Alert, Linking, Pressable, SafeAreaView, ScrollView, Text, View } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { theme } from '../../lib/theme';

// ── Helpers ───────────────────────────────────────────────────────────────────

function initials(first: string, last: string): string {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ProfileHeader({ firstName, lastName, rating, isVerified }: {
  firstName: string;
  lastName: string;
  rating: string;
  isVerified: boolean;
}) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 32 }}>
      {/* Avatar */}
      <View
        style={{
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: theme.colors.blueDim,
          borderWidth: 2,
          borderColor: theme.colors.borderActive,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 14,
        }}
      >
        <Text
          style={{
            fontFamily: theme.typography.fontDisplay,
            fontSize: 28,
            color: theme.colors.blue,
          }}
        >
          {initials(firstName, lastName)}
        </Text>
      </View>

      {/* Name */}
      <Text
        style={{
          fontFamily: theme.typography.fontDisplay,
          fontSize: 22,
          color: theme.colors.textPrimary,
          marginBottom: 4,
        }}
      >
        {firstName} {lastName}
      </Text>

      {/* Rating + verification */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        {rating !== '0' && rating !== '' && (
          <Text
            style={{
              fontFamily: theme.typography.fontBodyMedium,
              fontSize: 14,
              color: theme.colors.amber,
            }}
          >
            ★ {parseFloat(rating).toFixed(1)}
          </Text>
        )}
        {isVerified && (
          <View
            style={{
              backgroundColor: theme.colors.greenDim,
              borderRadius: theme.radius.sm,
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderWidth: 1,
              borderColor: theme.colors.green,
            }}
          >
            <Text
              style={{
                fontFamily: theme.typography.fontBodyMedium,
                fontSize: 11,
                color: theme.colors.green,
              }}
            >
              ✓ Verified
            </Text>
          </View>
        )}
        {!isVerified && (
          <View
            style={{
              backgroundColor: theme.colors.amberDim,
              borderRadius: theme.radius.sm,
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderWidth: 1,
              borderColor: theme.colors.amber,
            }}
          >
            <Text
              style={{
                fontFamily: theme.typography.fontBodyMedium,
                fontSize: 11,
                color: theme.colors.amber,
              }}
            >
              Pending verification
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

type RowProps = {
  icon: string;
  label: string;
  onPress: () => void;
  danger?: boolean;
  rightSlot?: React.ReactNode;
  showChevron?: boolean;
};

function SettingsRow({ icon, label, onPress, danger = false, rightSlot, showChevron = true }: RowProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: pressed ? theme.colors.bgElevated : 'transparent',
        gap: 14,
      })}
    >
      <Text style={{ fontSize: 18, width: 24, textAlign: 'center' }}>{icon}</Text>
      <Text
        style={{
          flex: 1,
          fontFamily: theme.typography.fontBodyMedium,
          fontSize: 15,
          color: danger ? theme.colors.red : theme.colors.textPrimary,
        }}
      >
        {label}
      </Text>
      {rightSlot !== undefined ? rightSlot : showChevron ? (
        <Text
          style={{
            fontFamily: theme.typography.fontBody,
            fontSize: 16,
            color: theme.colors.textMuted,
          }}
        >
          ›
        </Text>
      ) : null}
    </Pressable>
  );
}

function SectionGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 24 }}>
      <Text
        style={{
          fontFamily: theme.typography.fontBodySemiBold,
          fontSize: 12,
          color: theme.colors.textMuted,
          textTransform: 'uppercase',
          letterSpacing: 0.8,
          marginBottom: 8,
          paddingHorizontal: 4,
        }}
      >
        {title}
      </Text>
      <View
        style={{
          backgroundColor: theme.colors.bgCard,
          borderRadius: theme.radius.md,
          borderWidth: 1,
          borderColor: theme.colors.border,
          overflow: 'hidden',
        }}
      >
        {children}
      </View>
    </View>
  );
}

function RowSeparator() {
  return (
    <View
      style={{
        height: 1,
        backgroundColor: theme.colors.border,
        marginLeft: 54,
      }}
    />
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

const HELP_URL = 'https://raketmo.com/support';
const PRIVACY_URL = 'https://raketmo.com/privacy';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, signOut } = useAuthStore();

  const firstName = user?.first_name ?? '';
  const lastName = user?.last_name ?? '';
  const rating = user?.overall_rating ?? '0';
  const isVerified = (user?.is_verified ?? 0) === 1;

  async function handleSignOut() {
    Alert.alert(
      'Sign out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/');
          },
        },
      ],
    );
  }

  async function openUrl(url: string) {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    }
  }

  const verificationBadge = (
    <View
      style={{
        backgroundColor: isVerified ? theme.colors.greenDim : theme.colors.amberDim,
        borderRadius: theme.radius.sm,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderWidth: 1,
        borderColor: isVerified ? theme.colors.green : theme.colors.amber,
      }}
    >
      <Text
        style={{
          fontFamily: theme.typography.fontBodyMedium,
          fontSize: 11,
          color: isVerified ? theme.colors.green : theme.colors.amber,
        }}
      >
        {isVerified ? '✓ Verified' : 'Pending'}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bgBase }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
      >
        <ProfileHeader
          firstName={firstName}
          lastName={lastName}
          rating={rating}
          isVerified={isVerified}
        />

        {/* Account */}
        <SectionGroup title="Account">
          <SettingsRow icon="✏️" label="Edit Profile" onPress={() => router.push('/edit-profile')} />
          <RowSeparator />
          <SettingsRow icon="💳" label="Payment Settings" onPress={() => router.push('/payment-settings')} />
          <RowSeparator />
          <SettingsRow icon="🔔" label="Notifications" onPress={() => router.push('/notifications')} />
        </SectionGroup>

        {/* Worker */}
        <SectionGroup title="Worker">
          <SettingsRow icon="💰" label="My Earnings" onPress={() => router.push('/earnings')} />
          <RowSeparator />
          <SettingsRow icon="⭐" label="My Reviews" onPress={() => router.push('/reviews')} />
          <RowSeparator />
          <SettingsRow
            icon="🛡️"
            label="Verification Status"
            onPress={() => { if (!isVerified) router.push('/verify-identity'); }}
            showChevron={!isVerified}
            rightSlot={verificationBadge}
          />
        </SectionGroup>

        {/* App */}
        <SectionGroup title="App">
          <SettingsRow icon="❓" label="Help & Support" onPress={() => openUrl(HELP_URL)} />
          <RowSeparator />
          <SettingsRow icon="🔒" label="Privacy Policy" onPress={() => openUrl(PRIVACY_URL)} />
          <RowSeparator />
          <SettingsRow icon="🚪" label="Sign Out" onPress={handleSignOut} danger showChevron={false} />
        </SectionGroup>
      </ScrollView>
    </SafeAreaView>
  );
}
