import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { useQuery } from '@tanstack/react-query';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import MapView, {
  Circle,
  Marker,
  PROVIDER_GOOGLE,
  type Region,
} from 'react-native-maps';
import { useDebounce } from '../../hooks/useDebounce';
import { getAllJobs, type Job } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { theme } from '../../lib/theme';

// ── Dark map style (uses theme color values) ──────────────────────────────────

const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: theme.colors.bgBase }] },
  { elementType: 'labels.text.fill', stylers: [{ color: theme.colors.textSecondary }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: theme.colors.bgBase }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: theme.colors.bgElevated }] },
  { featureType: 'administrative.land_parcel', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: theme.colors.bgSurface }] },
  { featureType: 'poi', elementType: 'labels.text', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.park', elementType: 'geometry.fill', stylers: [{ color: '#141c1a' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: theme.colors.bgElevated }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: theme.colors.bgCard }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#2a3142' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: theme.colors.bgSurface }] },
  { featureType: 'road.local', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: theme.colors.bgSurface }] },
  { featureType: 'water', elementType: 'geometry.fill', stylers: [{ color: '#080b10' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: theme.colors.textMuted }] },
];

const MILES_TO_METERS = 1609.34;
const CATEGORIES = ['All', 'Cleaning', 'Moving', 'Handyman', 'Lawn', 'Delivery'] as const;
const RADIUS_PRESETS = [1, 5, 10, 25, 50] as const;

const DEFAULT_REGION: Region = {
  latitude: 37.7749,
  longitude: -122.4194,
  latitudeDelta: 0.15,
  longitudeDelta: 0.15,
};

// ── Custom marker ─────────────────────────────────────────────────────────────

function JobMarker({ amount, selected }: { amount: number; selected: boolean }) {
  return (
    <View
      style={{
        backgroundColor: selected ? theme.colors.blue : theme.colors.bgCard,
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderWidth: 1.5,
        borderColor: selected ? theme.colors.blue : theme.colors.borderActive,
        shadowColor: theme.colors.blueGlow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: selected ? 1 : 0,
        shadowRadius: 8,
        elevation: selected ? 6 : 2,
      }}
    >
      <Text
        style={{
          fontFamily: theme.typography.fontBodySemiBold,
          fontSize: 12,
          color: selected ? theme.colors.bgBase : theme.colors.textPrimary,
        }}
      >
        ${amount}
      </Text>
    </View>
  );
}

// ── Bottom sheet job card ─────────────────────────────────────────────────────

function MapJobCard({ job, selected, onPress }: { job: Job; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        width: 220,
        backgroundColor: selected ? theme.colors.bgElevated : theme.colors.bgSurface,
        borderRadius: theme.radius.md,
        borderWidth: 1,
        borderColor: selected ? theme.colors.borderActive : theme.colors.border,
        padding: 12,
        marginRight: 10,
      }}
    >
      <Text
        style={{
          fontFamily: theme.typography.fontBodySemiBold,
          fontSize: 14,
          color: theme.colors.textPrimary,
          marginBottom: 4,
        }}
        numberOfLines={1}
      >
        {job.title}
      </Text>

      <Text
        style={{
          fontFamily: theme.typography.fontBodySemiBold,
          fontSize: 13,
          color: theme.colors.green,
          marginBottom: 8,
        }}
      >
        ${job.min_bids}–${job.max_bids}
        {job.is_bids_more ? '+' : ''}
      </Text>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {job.category_name !== undefined && (
          <View
            style={{
              backgroundColor: theme.colors.blueDim,
              borderRadius: theme.radius.sm,
              paddingHorizontal: 6,
              paddingVertical: 2,
            }}
          >
            <Text
              style={{
                fontFamily: theme.typography.fontBodyMedium,
                fontSize: 10,
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
              fontSize: 11,
              color: theme.colors.textMuted,
            }}
          >
            {job.distance.toFixed(1)} mi
          </Text>
        )}
      </View>
    </Pressable>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function BrowseMapScreen() {
  const router = useRouter();
  const { token } = useAuthStore();
  const { height } = useWindowDimensions();

  const mapRef = useRef<MapView>(null);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const cardScrollRef = useRef<ScrollView>(null);

  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [radius, setRadius] = useState(10);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);

  const debouncedRadius = useDebounce(radius, 400);
  const categoryId = activeCategory === 'All' ? undefined : activeCategory.toLowerCase();

  const snapPoints = useMemo(() => ['35%', '70%'], []);

  // Request location on mount
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Location access denied. Showing default area.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setUserCoords({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
    })();
  }, []);

  const coords = userCoords ?? { latitude: DEFAULT_REGION.latitude, longitude: DEFAULT_REGION.longitude };

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['jobs', 'map', categoryId, debouncedRadius, coords.latitude, coords.longitude],
    queryFn: () =>
      getAllJobs(
        { longitude: coords.longitude, latitude: coords.latitude, category_id: categoryId, area: debouncedRadius },
        token ?? '',
      ),
    enabled: token !== null,
  });

  const jobs = data?.data ?? [];

  // Animate map to user location when obtained
  useEffect(() => {
    if (userCoords) {
      mapRef.current?.animateToRegion(
        {
          ...userCoords,
          latitudeDelta: 0.08,
          longitudeDelta: 0.08,
        },
        800,
      );
    }
  }, [userCoords]);

  function handleMarkerPress(job: Job) {
    setSelectedJobId(job.id);
    const idx = jobs.findIndex((j) => j.id === job.id);
    if (idx >= 0) {
      cardScrollRef.current?.scrollTo({ x: idx * 230, animated: true });
    }
  }

  function handleCardPress(job: Job) {
    setSelectedJobId(job.id);
    mapRef.current?.animateToRegion(
      {
        latitude: job.latitude,
        longitude: job.longitude,
        latitudeDelta: 0.04,
        longitudeDelta: 0.04,
      },
      600,
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bgBase }}>
      {/* Full screen map */}
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        provider={PROVIDER_GOOGLE}
        customMapStyle={DARK_MAP_STYLE}
        initialRegion={DEFAULT_REGION}
        showsUserLocation={userCoords !== null}
        showsMyLocationButton={false}
        showsCompass={false}
        toolbarEnabled={false}
      >
        {/* Radius circle */}
        {userCoords !== null && (
          <Circle
            center={userCoords}
            radius={debouncedRadius * MILES_TO_METERS}
            fillColor={theme.colors.blueDim}
            strokeColor={theme.colors.borderActive}
            strokeWidth={1}
          />
        )}

        {/* Job markers */}
        {jobs.map((job) => (
          <Marker
            key={job.id}
            coordinate={{ latitude: job.latitude, longitude: job.longitude }}
            onPress={() => handleMarkerPress(job)}
            tracksViewChanges={false}
          >
            <JobMarker amount={job.min_bids} selected={selectedJobId === job.id} />
          </Marker>
        ))}
      </MapView>

      {/* Floating filter row */}
      <View
        style={{
          position: 'absolute',
          top: 56,
          left: 0,
          right: 0,
          paddingHorizontal: 16,
          gap: 8,
        }}
      >
        {/* Category chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
        >
          {CATEGORIES.map((cat) => {
            const active = activeCategory === cat;
            return (
              <Pressable
                key={cat}
                onPress={() => setActiveCategory(cat)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: theme.radius.xl,
                  backgroundColor: active ? theme.colors.blue : theme.colors.bgCard,
                  borderWidth: 1,
                  borderColor: active ? theme.colors.blue : theme.colors.border,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.4,
                  shadowRadius: 4,
                  elevation: 4,
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

        {/* Radius presets */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 6 }}
        >
          <Text
            style={{
              fontFamily: theme.typography.fontBodyMedium,
              fontSize: 12,
              color: theme.colors.textMuted,
              alignSelf: 'center',
              marginRight: 4,
            }}
          >
            Within:
          </Text>
          {RADIUS_PRESETS.map((r) => {
            const active = radius === r;
            return (
              <Pressable
                key={r}
                onPress={() => setRadius(r)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: theme.radius.xl,
                  backgroundColor: active ? theme.colors.blueDim : theme.colors.bgCard,
                  borderWidth: 1,
                  borderColor: active ? theme.colors.borderActive : theme.colors.border,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.3,
                  shadowRadius: 3,
                  elevation: 3,
                }}
              >
                <Text
                  style={{
                    fontFamily: theme.typography.fontBodyMedium,
                    fontSize: 12,
                    color: active ? theme.colors.blue : theme.colors.textMuted,
                  }}
                >
                  {r} mi
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {locationError !== null && (
          <View
            style={{
              backgroundColor: theme.colors.amberDim,
              borderRadius: theme.radius.sm,
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderWidth: 1,
              borderColor: theme.colors.amber,
            }}
          >
            <Text
              style={{
                fontFamily: theme.typography.fontBody,
                fontSize: 12,
                color: theme.colors.amber,
              }}
            >
              {locationError}
            </Text>
          </View>
        )}
      </View>

      {/* Bottom sheet */}
      <BottomSheet
        ref={bottomSheetRef}
        index={0}
        snapPoints={snapPoints}
        backgroundStyle={{ backgroundColor: theme.colors.bgCard }}
        handleIndicatorStyle={{
          backgroundColor: theme.colors.textMuted,
          width: 36,
        }}
      >
        <BottomSheetView style={{ flex: 1 }}>
          {/* Sheet header */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingBottom: 12,
            }}
          >
            <Text
              style={{
                fontFamily: theme.typography.fontBodySemiBold,
                fontSize: 15,
                color: theme.colors.textPrimary,
              }}
            >
              {isLoading ? 'Loading…' : `${jobs.length} job${jobs.length !== 1 ? 's' : ''} nearby`}
            </Text>
            <Pressable onPress={() => router.push('/(tabs)/browse')} hitSlop={8}>
              <Text
                style={{
                  fontFamily: theme.typography.fontBodyMedium,
                  fontSize: 13,
                  color: theme.colors.blue,
                }}
              >
                List view
              </Text>
            </Pressable>
          </View>

          {/* Loading state */}
          {isLoading && (
            <View style={{ alignItems: 'center', paddingVertical: 24 }}>
              <ActivityIndicator color={theme.colors.blue} />
            </View>
          )}

          {/* Error state */}
          {isError && !isLoading && (
            <View style={{ alignItems: 'center', paddingVertical: 24, paddingHorizontal: 24 }}>
              <Text
                style={{
                  fontFamily: theme.typography.fontBodyMedium,
                  fontSize: 14,
                  color: theme.colors.textMuted,
                  textAlign: 'center',
                  marginBottom: 12,
                }}
              >
                Couldn't load jobs. Check your connection.
              </Text>
              <Pressable
                onPress={() => refetch()}
                style={({ pressed }) => ({
                  paddingHorizontal: 20,
                  paddingVertical: 10,
                  backgroundColor: pressed ? theme.colors.blueGlow : theme.colors.blue,
                  borderRadius: theme.radius.xl,
                })}
              >
                <Text
                  style={{
                    fontFamily: theme.typography.fontBodySemiBold,
                    fontSize: 13,
                    color: theme.colors.bgBase,
                  }}
                >
                  Retry
                </Text>
              </Pressable>
            </View>
          )}

          {/* Empty state */}
          {!isLoading && !isError && jobs.length === 0 && (
            <View style={{ alignItems: 'center', paddingVertical: 24 }}>
              <Text
                style={{
                  fontFamily: theme.typography.fontBodyMedium,
                  fontSize: 14,
                  color: theme.colors.textMuted,
                }}
              >
                No jobs in this area yet.
              </Text>
            </View>
          )}

          {/* Horizontal job cards */}
          {!isLoading && jobs.length > 0 && (
            <ScrollView
              ref={cardScrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
            >
              {jobs.map((job) => (
                <MapJobCard
                  key={job.id}
                  job={job}
                  selected={selectedJobId === job.id}
                  onPress={() => handleCardPress(job)}
                />
              ))}
            </ScrollView>
          )}
        </BottomSheetView>
      </BottomSheet>
    </View>
  );
}
