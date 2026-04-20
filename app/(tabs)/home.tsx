import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  SafeAreaView,
  Text,
  View,
} from 'react-native';
import { getAllJobs, type Job } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { theme } from '../../lib/theme';

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

// ── Sub-components ────────────────────────────────────────────────────────────

function EarningsCard({ totalEarning }: { totalEarning: number }) {
  return (
    <View
      style={{
        backgroundColor: theme.colors.bgCard,
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        paddingVertical: 20,
        paddingHorizontal: 16,
        flexDirection: 'row',
        marginHorizontal: 16,
        marginBottom: 28,
      }}
    >
      <MetricColumn label="Active Jobs" value="—" color={theme.colors.blue} />
      <Divider />
      <MetricColumn label="Pending Payout" value="—" color={theme.colors.amber} />
      <Divider />
      <MetricColumn
        label="This Week"
        value={`$${totalEarning.toFixed(0)}`}
        color={theme.colors.green}
      />
    </View>
  );
}

function MetricColumn({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <View style={{ flex: 1, alignItems: 'center', gap: 4 }}>
      <Text
        style={{
          fontFamily: theme.typography.fontDisplay,
          fontSize: 20,
          color,
        }}
      >
        {value}
      </Text>
      <Text
        style={{
          fontFamily: theme.typography.fontBody,
          fontSize: 11,
          color: theme.colors.textMuted,
          textAlign: 'center',
        }}
      >
        {label}
      </Text>
    </View>
  );
}

function Divider() {
  return (
    <View
      style={{
        width: 1,
        backgroundColor: theme.colors.border,
        marginHorizontal: 8,
      }}
    />
  );
}

function JobCard({ job }: { job: Job }) {
  const router = useRouter();

  return (
    <Pressable
      onPress={() => router.push(`/job/${job.id}`)}
      style={({ pressed }) => ({
        backgroundColor: pressed ? theme.colors.bgElevated : theme.colors.bgCard,
        borderRadius: theme.radius.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
        padding: 14,
        marginBottom: 10,
        marginHorizontal: 16,
      })}
    >
      {/* Title row */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
        <Text
          style={{
            fontFamily: theme.typography.fontBodySemiBold,
            fontSize: 15,
            color: theme.colors.textPrimary,
            flex: 1,
            marginRight: 8,
          }}
          numberOfLines={1}
        >
          {job.title}
        </Text>
        <Text
          style={{
            fontFamily: theme.typography.fontBodySemiBold,
            fontSize: 15,
            color: theme.colors.green,
          }}
        >
          ${job.min_bids}–${job.max_bids}
        </Text>
      </View>

      {/* Meta row */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {job.category_name !== undefined && (
          <View
            style={{
              backgroundColor: theme.colors.blueDim,
              borderRadius: theme.radius.sm,
              paddingHorizontal: 8,
              paddingVertical: 3,
            }}
          >
            <Text
              style={{
                fontFamily: theme.typography.fontBodyMedium,
                fontSize: 11,
                color: theme.colors.blue,
              }}
            >
              {job.category_name}
            </Text>
          </View>
        )}

        {job.distance !== undefined && (
          <Text
            style={{
              fontFamily: theme.typography.fontBody,
              fontSize: 12,
              color: theme.colors.textMuted,
            }}
          >
            {job.distance.toFixed(1)} mi
          </Text>
        )}

        <Text
          style={{
            fontFamily: theme.typography.fontBody,
            fontSize: 12,
            color: theme.colors.textMuted,
            marginLeft: 'auto',
          }}
        >
          {job.created_at !== undefined ? timeAgo(job.created_at) : job.jobs_date}
        </Text>
      </View>
    </Pressable>
  );
}

function SectionHeader({ onSeeAll }: { onSeeAll: () => void }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginHorizontal: 16,
        marginBottom: 12,
      }}
    >
      <Text
        style={{
          fontFamily: theme.typography.fontBodySemiBold,
          fontSize: 16,
          color: theme.colors.textPrimary,
        }}
      >
        Recent Jobs Near You
      </Text>
      <Pressable onPress={onSeeAll} hitSlop={8}>
        <Text
          style={{
            fontFamily: theme.typography.fontBodyMedium,
            fontSize: 13,
            color: theme.colors.blue,
          }}
        >
          See all
        </Text>
      </Pressable>
    </View>
  );
}

function EmptyState({ onPost }: { onPost: () => void }) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 48, paddingHorizontal: 32 }}>
      <Text
        style={{
          fontFamily: theme.typography.fontBodySemiBold,
          fontSize: 16,
          color: theme.colors.textPrimary,
          marginBottom: 8,
          textAlign: 'center',
        }}
      >
        No jobs nearby yet
      </Text>
      <Text
        style={{
          fontFamily: theme.typography.fontBody,
          fontSize: 14,
          color: theme.colors.textMuted,
          textAlign: 'center',
          marginBottom: 20,
        }}
      >
        Be the first to post a gig in your area.
      </Text>
      <Pressable
        onPress={onPost}
        style={({ pressed }) => ({
          backgroundColor: pressed ? theme.colors.blueGlow : theme.colors.blue,
          borderRadius: theme.radius.xl,
          paddingVertical: 12,
          paddingHorizontal: 24,
        })}
      >
        <Text
          style={{
            fontFamily: theme.typography.fontBodySemiBold,
            fontSize: 14,
            color: theme.colors.bgBase,
          }}
        >
          Post a Job
        </Text>
      </Pressable>
    </View>
  );
}

function QuickActions({ onPost, onBrowse }: { onPost: () => void; onBrowse: () => void }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        gap: 12,
        marginHorizontal: 16,
        marginTop: 8,
        marginBottom: 24,
      }}
    >
      <Pressable
        onPress={onPost}
        style={({ pressed }) => ({
          flex: 1,
          height: 48,
          backgroundColor: pressed ? theme.colors.blueGlow : theme.colors.blue,
          borderRadius: theme.radius.xl,
          alignItems: 'center',
          justifyContent: 'center',
        })}
      >
        <Text
          style={{
            fontFamily: theme.typography.fontBodySemiBold,
            fontSize: 14,
            color: theme.colors.bgBase,
          }}
        >
          Post a Job
        </Text>
      </Pressable>

      <Pressable
        onPress={onBrowse}
        style={({ pressed }) => ({
          flex: 1,
          height: 48,
          backgroundColor: pressed ? theme.colors.bgElevated : theme.colors.bgCard,
          borderRadius: theme.radius.xl,
          borderWidth: 1,
          borderColor: theme.colors.border,
          alignItems: 'center',
          justifyContent: 'center',
        })}
      >
        <Text
          style={{
            fontFamily: theme.typography.fontBodySemiBold,
            fontSize: 14,
            color: theme.colors.textSecondary,
          }}
        >
          Browse All
        </Text>
      </Pressable>
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const router = useRouter();
  const { user, token } = useAuthStore();

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['jobs', 'feed'],
    queryFn: () => getAllJobs({ longitude: 0, latitude: 0 }, token ?? ''),
    enabled: token !== null,
  });

  const jobs = data?.data ?? [];
  const firstName = user?.first_name ?? 'there';
  const totalEarning = parseFloat(String(user?.access_token ?? '0')) || 0;

  function handlePost() {
    router.push('/post-job');
  }

  function handleBrowse() {
    router.push('/browse');
  }

  if (isLoading) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: theme.colors.bgBase,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator color={theme.colors.blue} />
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: theme.colors.bgBase,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 32,
        }}
      >
        <Text
          style={{
            fontFamily: theme.typography.fontBodySemiBold,
            fontSize: 16,
            color: theme.colors.textPrimary,
            textAlign: 'center',
            marginBottom: 8,
          }}
        >
          Couldn't load jobs
        </Text>
        <Text
          style={{
            fontFamily: theme.typography.fontBody,
            fontSize: 14,
            color: theme.colors.textMuted,
            textAlign: 'center',
            marginBottom: 20,
          }}
        >
          Check your connection and try again.
        </Text>
        <Pressable
          onPress={() => refetch()}
          style={({ pressed }) => ({
            backgroundColor: pressed ? theme.colors.blueGlow : theme.colors.blue,
            borderRadius: theme.radius.xl,
            paddingVertical: 12,
            paddingHorizontal: 24,
          })}
        >
          <Text
            style={{
              fontFamily: theme.typography.fontBodySemiBold,
              fontSize: 14,
              color: theme.colors.bgBase,
            }}
          >
            Retry
          </Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bgBase }}>
      <FlatList<Job>
        data={jobs}
        keyExtractor={(item) => String(item.id)}
        refreshing={isRefetching}
        onRefresh={refetch}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {/* Greeting */}
            <View style={{ paddingHorizontal: 16, paddingTop: 20, marginBottom: 20 }}>
              <Text
                style={{
                  fontFamily: theme.typography.fontDisplay,
                  fontSize: 22,
                  color: theme.colors.textPrimary,
                  marginBottom: 2,
                }}
              >
                {greeting()}, {firstName}
              </Text>
              <Text
                style={{
                  fontFamily: theme.typography.fontBody,
                  fontSize: 14,
                  color: theme.colors.textSecondary,
                }}
              >
                Here's what's happening nearby.
              </Text>
            </View>

            <EarningsCard totalEarning={totalEarning} />

            <SectionHeader onSeeAll={handleBrowse} />
          </>
        }
        renderItem={({ item }) => <JobCard job={item} />}
        ListEmptyComponent={<EmptyState onPost={handlePost} />}
        ListFooterComponent={
          jobs.length > 0 ? (
            <QuickActions onPost={handlePost} onBrowse={handleBrowse} />
          ) : null
        }
      />
    </SafeAreaView>
  );
}
