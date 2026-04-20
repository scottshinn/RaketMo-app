import { useRouter } from 'expo-router';
import { Pressable, SafeAreaView, Text, View, useWindowDimensions } from 'react-native';
import { theme } from '../lib/theme';

export default function OnboardingScreen() {
  const router = useRouter();
  const { height } = useWindowDimensions();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bgBase }}>
      {/* Hero — top 45% */}
      <View
        style={{
          height: height * 0.45,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
        }}
      >
        <Text
          style={{
            fontFamily: theme.typography.fontDisplay,
            fontSize: 42,
            color: theme.colors.textPrimary,
            textShadowColor: theme.colors.blueGlow,
            textShadowOffset: { width: 0, height: 0 },
            textShadowRadius: 40,
            letterSpacing: -1,
          }}
        >
          RaketMo
        </Text>
        <Text
          style={{
            fontFamily: theme.typography.fontBody,
            fontSize: 16,
            color: theme.colors.textSecondary,
            textAlign: 'center',
          }}
        >
          Find local gigs. Get paid fast.
        </Text>
      </View>

      {/* Spacer */}
      <View style={{ flex: 1 }} />

      {/* Buttons — bottom 40% */}
      <View
        style={{
          height: height * 0.4,
          paddingHorizontal: 28,
          paddingBottom: 36,
          justifyContent: 'flex-end',
          gap: 12,
        }}
      >
        <Pressable
          onPress={() => router.push('/signup')}
          style={({ pressed }) => ({
            height: 52,
            backgroundColor: pressed ? theme.colors.blueGlow : theme.colors.blue,
            borderRadius: theme.radius.xl,
            alignItems: 'center',
            justifyContent: 'center',
          })}
        >
          <Text
            style={{
              fontFamily: theme.typography.fontBodySemiBold,
              fontSize: 16,
              color: theme.colors.bgBase,
            }}
          >
            Get Started
          </Text>
        </Pressable>

        <Pressable
          onPress={() => router.push('/login')}
          style={({ pressed }) => ({
            height: 52,
            backgroundColor: pressed ? theme.colors.bgCard : 'transparent',
            borderRadius: theme.radius.xl,
            borderWidth: 1,
            borderColor: theme.colors.border,
            alignItems: 'center',
            justifyContent: 'center',
          })}
        >
          <Text
            style={{
              fontFamily: theme.typography.fontBodyMedium,
              fontSize: 16,
              color: theme.colors.textSecondary,
            }}
          >
            I already have an account
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
