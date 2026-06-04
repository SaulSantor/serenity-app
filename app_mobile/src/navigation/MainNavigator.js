import React from 'react';
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { Ionicons } from '@expo/vector-icons';

import DashboardScreen from "../screens/dashboard/DashboardScreen";
import MeditationsStack from "./MeditationsStack";
import ProgressScreen from "../screens/practices/ProgressScreen";
import CommunityScreen from "../screens/dashboard/CommunityScreen";
import ProfileStack from "./ProfileStack";
import IoTMonitorScreen from "../screens/IoTMonitorScreen";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Stack para la pantalla de Inicio + IoT Monitor
function HomeStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="DashboardMain" component={DashboardScreen} />
            <Stack.Screen name="IoTMonitor" component={IoTMonitorScreen} />
        </Stack.Navigator>
    );
}

export default function MainNavigator() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;

                    if (route.name === 'Inicio') {
                        iconName = focused ? 'home' : 'home-outline';
                    } else if (route.name === 'Prácticas') {
                        iconName = focused ? 'leaf' : 'leaf-outline';
                    } else if (route.name === 'Progreso') {
                        iconName = focused ? 'stats-chart' : 'stats-chart-outline';
                    } else if (route.name === 'Comunidad') {
                        iconName = focused ? 'people' : 'people-outline';
                    } else if (route.name === 'Perfil') {
                        iconName = focused ? 'person' : 'person-outline';
                    }

                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: '#667EEA',
                tabBarInactiveTintColor: 'gray',
            })}
        >
            <Tab.Screen 
                name="Inicio" 
                component={HomeStack}
                options={{ headerShown: false }}
            />
            <Tab.Screen 
                name="Prácticas" 
                component={MeditationsStack}
                options={{ headerShown: false }}
                listeners={({ navigation }) => ({
                    tabPress: (e) => {
                        // Reset the stack to show the list screen when tab is pressed
                        navigation.reset({
                            index: 0,
                            routes: [{ name: 'Prácticas' }],
                        });
                    },
                })}
            />
            <Tab.Screen 
                name="Progreso" 
                component={ProgressScreen}
                options={{ headerShown: false }}
            />
            <Tab.Screen 
                name="Comunidad" 
                component={CommunityScreen}
                options={{ headerShown: false }}
            />
            <Tab.Screen 
                name="Perfil" 
                component={ProfileStack}
                options={{ headerShown: false }}
            />
        </Tab.Navigator>
    );
}