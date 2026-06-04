import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import API from '../api/backend';

const IoTMonitorScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [latestReading, setLatestReading] = useState(null);
  const [devices, setDevices] = useState([]);
  const [statistics, setStatistics] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  // 🔄 Auto-actualización cada 3 segundos
  useEffect(() => {
    const startPolling = async () => {
      // Obtener user_id actual
      let currentUserId = user?._id;
      
      if (!currentUserId) {
        try {
          const userRes = await API.get('/users/me');
          currentUserId = userRes.data.user?._id;
        } catch (error) {
          console.error('[IoT] Error obteniendo user para polling');
          return;
        }
      }

      if (!currentUserId) return;

      const interval = setInterval(() => {
        fetchLatestReading(currentUserId);
      }, 3000);

      return () => clearInterval(interval);
    };

    startPolling();
  }, [user]);

  const fetchLatestReading = async (uid) => {
    try {
      const latestRes = await API.get(`/iot/sensors/latest/${uid}`);
      if (latestRes.data.success && latestRes.data.reading) {
        setLatestReading(latestRes.data.reading);
      }
    } catch (error) {
      // Error silencioso en auto-actualización
    }
  };

  const loadData = async () => {
    try {
      // Si no hay user en contexto, obtenerlo de la API
      let currentUserId = user?._id;
      
      if (!currentUserId) {
        const userRes = await API.get('/users/me');
        if (userRes.data.user) {
          currentUserId = userRes.data.user._id || userRes.data.user.id;
        } else if (userRes.data._id) {
          currentUserId = userRes.data._id || userRes.data.id;
        } else {
          setLoading(false);
          return;
        }
      }

      await fetchAllData(currentUserId);
    } catch (error) {
      console.error('[IoT] Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllData = async (uid) => {
    try {
      // Obtener última lectura
      const latestRes = await API.get(`/iot/sensors/latest/${uid}`);
      if (latestRes.data.success && latestRes.data.reading) {
        setLatestReading(latestRes.data.reading);
      }

      // Obtener dispositivos
      const devicesRes = await API.get(`/iot/devices/${uid}`);
      if (devicesRes.data.success) {
        setDevices(devicesRes.data.devices);
      }

      // Obtener estadísticas del día
      const statsRes = await API.get(`/iot/sensors/statistics/${uid}`);
      if (statsRes.data.success) {
        setStatistics(statsRes.data.statistics);
      }
    } catch (error) {
      console.error('[IoT] Error obteniendo datos:', error.message);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      let currentUserId = user?._id;
      
      if (!currentUserId) {
        const userRes = await API.get('/users/me');
        currentUserId = userRes.data.user?._id;
      }
      
      if (currentUserId) {
        await fetchAllData(currentUserId);
      }
    } catch (error) {
      console.error('[IoT] Error en refresh:', error);
    }
    setRefreshing(false);
  };

  const getStressLevelColor = (level) => {
    if (level >= 70) return '#FF6B6B';
    if (level >= 40) return '#FFA94D';
    return '#88C9A1';
  };

  const getStressLevelText = (level) => {
    if (level >= 70) return 'Alto';
    if (level >= 40) return 'Moderado';
    return 'Normal';
  };

  const getTouchActivityColor = (frequency) => {
    if (frequency >= 30) return '#FF6B6B';
    if (frequency >= 15) return '#FFA94D';
    return '#88C9A1';
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#7BB6E8" />
      </View>
    );
  }

  return (
    <LinearGradient colors={['#F3F6F8', '#FFFFFF']} style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#7BB6E8']} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#2F3A45" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Monitor IoT</Text>
          <TouchableOpacity onPress={onRefresh}>
            <Ionicons name="refresh" size={24} color="#7BB6E8" />
          </TouchableOpacity>
        </View>

        {/* Última Lectura */}
        {latestReading ? (
          <>
            {/* Nivel de Estrés */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="fitness" size={24} color="#7BB6E8" />
                <Text style={styles.cardTitle}>Nivel de Estrés Actual</Text>
              </View>
              
              <View style={styles.stressContainer}>
                <View
                  style={[
                    styles.stressCircle,
                    { borderColor: getStressLevelColor(latestReading.stress_analysis.stress_level) }
                  ]}
                >
                  <Text
                    style={[
                      styles.stressNumber,
                      { color: getStressLevelColor(latestReading.stress_analysis.stress_level) }
                    ]}
                  >
                    {Math.round(latestReading.stress_analysis.stress_level)}
                  </Text>
                  <Text style={styles.stressUnit}>/ 100</Text>
                </View>
                
                <View style={styles.stressInfo}>
                  <Text
                    style={[
                      styles.stressLevel,
                      { color: getStressLevelColor(latestReading.stress_analysis.stress_level) }
                    ]}
                  >
                    {getStressLevelText(latestReading.stress_analysis.stress_level)}
                  </Text>
                  <Text style={styles.stressTime}>
                    {new Date(latestReading.timestamp).toLocaleTimeString('es-ES', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Text>
                </View>
              </View>

              {/* Recomendación */}
              {latestReading.stress_analysis.recommendation && (
                <View style={styles.recommendationBox}>
                  <Ionicons name="bulb-outline" size={20} color="#FFA94D" />
                  <Text style={styles.recommendationText}>
                    {latestReading.stress_analysis.recommendation}
                  </Text>
                </View>
              )}
            </View>

            {/* Sensores Táctiles */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="hand-left" size={24} color="#7BB6E8" />
                <Text style={styles.cardTitle}>Actividad Táctil</Text>
              </View>

              <View style={styles.touchButtonsContainer}>
                {[1, 2, 3, 4, 5].map((num) => {
                  const isActive = latestReading.touch_sensors[`button_${num}`];
                  return (
                    <View
                      key={num}
                      style={[styles.touchButton, isActive && styles.touchButtonActive]}
                    >
                      <Text style={[styles.touchButtonText, isActive && styles.touchButtonTextActive]}>
                        {num}
                      </Text>
                    </View>
                  );
                })}
              </View>

              <View style={styles.touchStats}>
                <View style={styles.touchStat}>
                  <Text style={styles.touchStatNumber}>
                    {latestReading.touch_sensors.touch_count}
                  </Text>
                  <Text style={styles.touchStatLabel}>Toques totales</Text>
                </View>
                <View style={styles.touchStat}>
                  <Text
                    style={[
                      styles.touchStatNumber,
                      { color: getTouchActivityColor(latestReading.touch_sensors.touch_frequency) }
                    ]}
                  >
                    {latestReading.touch_sensors.touch_frequency.toFixed(1)}
                  </Text>
                  <Text style={styles.touchStatLabel}>Toques/min</Text>
                </View>
              </View>
            </View>

            {/* Ambiente */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="thermometer" size={24} color="#7BB6E8" />
                <Text style={styles.cardTitle}>Condiciones Ambientales</Text>
              </View>

              <View style={styles.environmentRow}>
                <View style={styles.environmentItem}>
                  <Ionicons name="thermometer-outline" size={32} color="#FF6B6B" />
                  <Text style={styles.environmentValue}>
                    {latestReading.environment.temperature.toFixed(1)}°C
                  </Text>
                  <Text style={styles.environmentLabel}>Temperatura</Text>
                </View>

                <View style={styles.environmentItem}>
                  <Ionicons name="water-outline" size={32} color="#7BB6E8" />
                  <Text style={styles.environmentValue}>
                    {latestReading.environment.humidity.toFixed(0)}%
                  </Text>
                  <Text style={styles.environmentLabel}>Humedad</Text>
                </View>
              </View>

              <View style={styles.comfortBadge}>
                <Text style={styles.comfortText}>
                  {latestReading.environment.comfort_index === 'comfortable' && '😊 Confortable'}
                  {latestReading.environment.comfort_index === 'warm' && '🌡️ Cálido'}
                  {latestReading.environment.comfort_index === 'cold' && '❄️ Frío'}
                  {latestReading.environment.comfort_index === 'humid' && '💧 Húmedo'}
                </Text>
              </View>
            </View>

            {/* Presión */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="hand-right" size={24} color="#7BB6E8" />
                <Text style={styles.cardTitle}>Presión de Agarre</Text>
              </View>

              <View style={styles.pressureContainer}>
                <Text style={styles.pressureValue}>
                  {latestReading.pressure.value.toFixed(1)} kPa
                </Text>
                <Text style={styles.pressureLabel}>
                  Fuerza: {latestReading.pressure.grip_strength.toUpperCase()}
                </Text>
                {latestReading.pressure.tension_detected && (
                  <View style={styles.tensionAlert}>
                    <Ionicons name="warning" size={20} color="#FF6B6B" />
                    <Text style={styles.tensionText}>Tensión detectada</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Estadísticas del Día */}
            {statistics && statistics.total_readings > 0 && (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Ionicons name="stats-chart" size={24} color="#7BB6E8" />
                  <Text style={styles.cardTitle}>Estadísticas de Hoy</Text>
                </View>

                <View style={styles.statsGrid}>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{statistics.total_readings}</Text>
                    <Text style={styles.statLabel}>Lecturas</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>
                      {Math.round(statistics.avg_stress_level)}
                    </Text>
                    <Text style={styles.statLabel}>Estrés promedio</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{statistics.total_touch_events}</Text>
                    <Text style={styles.statLabel}>Toques totales</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: '#FF6B6B' }]}>
                      {statistics.high_stress_count}
                    </Text>
                    <Text style={styles.statLabel}>Episodios altos</Text>
                  </View>
                </View>
              </View>
            )}
          </>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="hardware-chip-outline" size={64} color="#C9D1D9" />
            <Text style={styles.emptyTitle}>No hay datos del dispositivo</Text>
            <Text style={styles.emptyText}>
              Asegúrate de que tu dispositivo IoT esté encendido y conectado a WiFi.
            </Text>
          </View>
        )}

        {/* Dispositivos Registrados */}
        {devices.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="hardware-chip" size={24} color="#7BB6E8" />
              <Text style={styles.cardTitle}>Dispositivos</Text>
            </View>

            {devices.map((device) => (
              <View key={device.device_id} style={styles.deviceItem}>
                <View style={styles.deviceInfo}>
                  <Text style={styles.deviceName}>{device.device_name}</Text>
                  <Text style={styles.deviceId}>ID: {device.device_id}</Text>
                </View>
                <View style={[styles.deviceStatus, { backgroundColor: device.status === 'active' ? '#88C9A1' : '#C9D1D9' }]}>
                  <Text style={styles.deviceStatusText}>
                    {device.status === 'active' ? 'Activo' : 'Inactivo'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F6F8',
  },
  scrollContent: {
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2F3A45',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2F3A45',
    marginLeft: 10,
  },
  stressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  stressCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  stressNumber: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  stressUnit: {
    fontSize: 14,
    color: '#6B7280',
  },
  stressInfo: {
    flex: 1,
  },
  stressLevel: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  stressTime: {
    fontSize: 14,
    color: '#6B7280',
  },
  recommendationBox: {
    flexDirection: 'row',
    backgroundColor: '#FFF5E6',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  recommendationText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#2F3A45',
    lineHeight: 20,
  },
  touchButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  touchButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F3F6F8',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#C9D1D9',
  },
  touchButtonActive: {
    backgroundColor: '#7BB6E8',
    borderColor: '#7BB6E8',
  },
  touchButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6B7280',
  },
  touchButtonTextActive: {
    color: '#FFFFFF',
  },
  touchStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  touchStat: {
    alignItems: 'center',
  },
  touchStatNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#7BB6E8',
  },
  touchStatLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  environmentRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  environmentItem: {
    alignItems: 'center',
  },
  environmentValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2F3A45',
    marginTop: 8,
  },
  environmentLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  comfortBadge: {
    backgroundColor: '#F3F6F8',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: 'center',
  },
  comfortText: {
    fontSize: 14,
    color: '#2F3A45',
  },
  pressureContainer: {
    alignItems: 'center',
  },
  pressureValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#7BB6E8',
  },
  pressureLabel: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 8,
  },
  tensionAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE6E6',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginTop: 12,
  },
  tensionText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#FF6B6B',
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    backgroundColor: '#F3F6F8',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#7BB6E8',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2F3A45',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  deviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F3F6F8',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2F3A45',
  },
  deviceId: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  deviceStatus: {
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  deviceStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default IoTMonitorScreen;
