import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MeditationsScreen from '../screens/meditations/MeditationsScreen';
import TechniqueDetailScreen from '../screens/meditations/TechniqueDetailScreen';
import MeditationPlayerScreen from '../screens/meditations/MeditationPlayerScreen';
import BreathingExerciseScreen from '../screens/exercises/BreathingExerciseScreen';
import GroundingExerciseScreen from '../screens/exercises/GroundingExerciseScreen';
import PMRExerciseScreen from '../screens/exercises/PMRExerciseScreen';
import EFTTappingScreen from '../screens/exercises/EFTTappingScreen';

const Stack = createNativeStackNavigator();

export default function MeditationsStack() {
    return (
        <Stack.Navigator>
            <Stack.Screen 
                name="MeditationsList" 
                component={MeditationsScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen 
                name="TechniqueDetail" 
                component={TechniqueDetailScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen 
                name="MeditationPlayer" 
                component={MeditationPlayerScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen 
                name="BreathingExercise" 
                component={BreathingExerciseScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen 
                name="GroundingExercise" 
                component={GroundingExerciseScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen 
                name="PMRExercise" 
                component={PMRExerciseScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen 
                name="EFTTapping" 
                component={EFTTappingScreen}
                options={{ headerShown: false }}
            />
        </Stack.Navigator>
    );
}
