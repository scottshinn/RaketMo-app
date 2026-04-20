import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useDebounce } from '../../hooks/useDebounce';
import { getAllJobs, type Job } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { theme } from '../../lib/theme';

// ── Constants ─────────────────────────────────────────────────────────────────

const CATEGORIES = ['All', 'Cleaning', 'Moving', 'Handyman', 'Lawn', 'Delivery'] as const;
const PAGE_SIZE = 10;

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

// ── Skeleton ──────────────────────────────────────────────────────────────────

function SkeletonCard() {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 750,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [opacity]);

  return (
    <Animated.View
      style={{
        opacity,
        backgroundColor: theme.colors.bgCard,
        borderRadius: theme.radius.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
        padding: 14,
        marginBottom: 10,
        gap: 10,
      }}
    >
      <View
        style={{
          height: 16,
          width: '60%',
          backgroundColor: theme.colors.bgElevated,
          borderRadius: theme.radius.sm,
        }}
      />
      <View
        style={{
          height: 12,
          width: '40%',
          backgroundColor: theme.colors.bgElevated,
          borderRadius: theme.radius.sm,
        }}
      />
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View
          style={{
            height: 22,
            width: 70,
            backgroundColor: theme.colors.bgElevated,
            borderRadius: theme.radius.sm,
          }}
        />
        <View
          style={{
            height: 22,
            width: 50,
            backgroundColor: theme.colors.bgElevated,
            borderRadius: theme.radius.sm,
          }}
        />
      </View>
    </Animated.View>
  );
}

const SKELETON_KEYS = ['s1', 's2', 's3', 's4', 's5'] as const;

function SkeletonList() {
  return (
    <View style={{ paddingTop: 4 }}>
      {SKELETON_KEYS.map((k) => (
        <SkeletonCard key={k} />
      ))}
    </View>
  );
}

// ── Job card ──────────────────────────────────────────────────────────────────

function JobBrowseCard({ job }: { job: Job }) {
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
      })}
    >
      {/* Title + budget */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 6,
        }}
      >
        <Text
          style={{
            fontFamily: theme.typography.fontBodySemiBold,
            fontSize: 15,
            color: theme.colors.textPrimary,
            flex: 1,
            marginRight: 12,
          }}
          numberOfLines={1}
        >
          {job.title}
        </Text>
        <Text
          style={{
            fontFamily: theme.typography.fontBodySemiBold,
            fontSize: 14,
            color: theme.colors.green,
            flexShrink: 0,
          }}
        >
          ${job.min_bids}–${job.max_bids}
          {job.is_bids_more ? '+' : ''}
        </Text>
      </View>

      {/* Category + distance */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
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
            {job.distance.toFixed(1)} mi away
          </Text>
        )}
      </View>

      {/* Footer: poster rating + bid count + time */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          {job.poster_rating !== undefined && (
            <Text
              style={{
                fontFamily: theme.typography.fontBody,
                fontSize: 12,
                color: theme.colors.amber,
              }}
            >
              ★ {job.poster_rating}
            </Text>
          )}
          {job.bid_count !== undefined && (
            <Text
              style={{
                fontFamily: theme.typography.fontBody,
                fontSize: 12,
                color: theme.colors.textMuted,
              }}
            >
              {job.bid_count} bid{job.bid_count !== 1 ? 's' : ''}
            </Text>
          )}
        </View>
        <Text
          style={{
            fontFamily: theme.typography.fontBody,
            fontSize: 12,
            color: theme.colors.textMuted,
          }}
        >
          {job.created_at !== undefined ? timeAgo(job.created_at) : job.jobs_date}
        </Text>
      </View>
    </Pressable>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function BrowseScreen() {
  const { token } = useAuthStore();

  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [radius, setRadius] = useState(10);
  const [page, setPage] = useState(1);
  const [allJobs, setAllJobs] = useState<Job[]>([]);

  const debouncedSearch = useDebounce(search, 400);
  const debouncedRadius = useDebounce(radius, 400);

  const categoryId = activeCategory === 'All' ? undefined : activeCategory.toLowerCase();

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['jobs', 'browse', categoryId, debouncedRadius, page],
    queryFn: () =>
      getAllJobs(
        { longitude: 0, latitude: 0, category_id: categoryId, area: debouncedRadius, page },
        token ?? '',
      ),
    enabled: token !== null,
  });

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
    setAllJobs([]);
  }, [activeCategory, debouncedRadius]);

  // Accumulate pages
  useEffect(() => {
    if (data?.data) {
      setAllJobs((prev) => (page === 1 ? data.data : [...prev, ...data.data]));
    }
  }, [data, page]);

  // Client-side search filter
  const filtered =
    debouncedSearch.trim().length > 0
      ? allJobs.filter((j) =>
          j.title.toLowerCase().includes(debouncedSearch.toLowerCase()),
        )
      : allJobs;

  const hasMore = (data?.data?.length ?? 0) >= PAGE_SIZE;
  const showSkeleton = isLoading && page === 1;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bgBase }}>
      {/* Search bar — sticky outside FlatList */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 10,
          backgroundColor: theme.colors.bgBase,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: theme.colors.bgCard,
            borderRadius: theme.radius.xl,
            borderWidth: 1,
            borderColor: theme.colors.border,
            paddingHorizontal: 14,
            height: 46,
            gap: 10,
          }}
        >
          <Text
            style={{
              fontSize: 16,
              color: theme.colors.textMuted,
            }}
          >
            ⌕
          </Text>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search jobs…"
            placeholderTextColor={theme.colors.textMuted}
            returnKeyType="search"
            autoCapitalize="none"
            style={{
              flex: 1,
              fontFamily: theme.typography.fontBody,
              fontSize: 15,
              color: theme.colors.textPrimary,
              height: '100%',
            }}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')} hitSlop={8}>
              <Text
                style={{
                  fontSize: 16,
                  color: theme.colors.textMuted,
                }}
              >
                ×
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      <FlatList<Job>
        data={showSkeleton ? [] : filtered}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {/* Category chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingVertical: 4, marginBottom: 14 }}
            >
              {CATEGORIES.map((cat) => {
                const active = activeCategory === cat;
                return (
                  <Pressable
                    key={cat}
                    onPress={() => setActiveCategory(cat)}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      borderRadius: theme.radius.xl,
                      backgroundColor: active ? theme.colors.blue : theme.colors.bgCard,
                      borderWidth: 1,
                      borderColor: active ? theme.colors.blue : theme.colors.border,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: theme.typography.fontBodyMedium,
                        fontSize: 13,
                        color: active ? theme.colors.bgBase : theme.colors.textSecondary,
                      }}
                    >
                      {cat}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Radius control */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, marginBottom: 16 }}
            >
              <Text
                style={{
                  fontFamily: theme.typography.fontBodyMedium,
                  fontSize: 13,
                  color: theme.colors.textSecondary,
                  alignSelf: 'center',
                  marginRight: 2,
                }}
              >
                Within:
              </Text>
              {([1, 5, 10, 25, 50] as const).map((r) => {
                const active = radius === r;
                return (
                  <Pressable
                    key={r}
                    onPress={() => setRadius(r)}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: theme.radius.xl,
                      backgroundColor: active ? theme.colors.blueDim : theme.colors.bgCard,
                      borderWidth: 1,
                      borderColor: active ? theme.colors.borderActive : theme.colors.border,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: theme.typography.fontBodyMedium,
                        fontSize: 13,
                        color: active ? theme.colors.blue : theme.colors.textMuted,
                      }}
                    >
                      {r} mi
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {showSkeleton && <SkeletonList />}
          </>
        }
        renderItem={({ item }) => <JobBrowseCard job={item} />}
        ListEmptyComponent={
          !showSkeleton ? (
            <View style={{ alignItems: 'center', paddingVertical: 48 }}>
              <Text
                style={{
                  fontFamily: theme.typography.fontBodySemiBold,
                  fontSize: 16,
                  color: theme.colors.textPrimary,
                  marginBottom: 6,
                }}
              >
                No jobs found
              </Text>
              <Text
                style={{
                  fontFamily: theme.typography.fontBody,
                  fontSize: 14,
                  color: theme.colors.textMuted,
                  textAlign: 'center',
                }}
              >
                Try a wider radius or different category.
              </Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          hasMore && !isFetching ? (
            <Pressable
              onPress={() => setPage((p) => p + 1)}
              style={({ pressed }) => ({
                height: 48,
                backgroundColor: pressed ? theme.colors.bgElevated : theme.colors.bgCard,
                borderRadius: theme.radius.xl,
                borderWidth: 1,
                borderColor: theme.colors.border,
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: 8,
              })}
            >
              <Text
                style={{
                  fontFamily: theme.typography.fontBodyMedium,
                  fontSize: 14,
                  color: theme.colors.textSecondary,
                }}
              >
                Load more
              </Text>
            </Pressable>
          ) : isFetching && page > 1 ? (
            <View style={{ paddingVertical: 16, alignItems: 'center' }}>
              <Text
                style={{
                  fontFamily: theme.typography.fontBody,
                  fontSize: 13,
                  color: theme.colors.textMuted,
                }}
              >
                Loading…
              </Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}
