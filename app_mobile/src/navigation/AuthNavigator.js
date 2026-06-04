import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LandingScreen from "../screens/auth/LandingScreen";
import LoginScreen from "../screens/auth/LoginScreen";
import RegisterScreen from "../screens/auth/RegisterScreen";

const Stack = createNativeStackNavigator();

export default function AuthNavigator() {
    return (
        <Stack.Navigator initialRouteName="Register">
            <Stack.Screen 
                name="Register" 
                component={RegisterScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen 
                name="Login" 
                component={LoginScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen 
                name="Landing" 
                component={LandingScreen}
                options={{ headerShown: false }}
            />
        </Stack.Navigator>
    );
}