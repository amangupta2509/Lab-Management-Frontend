import Animated from "react-native-reanimated";

export function HelloWave() {
  return (
    <Animated.Text
      style={{
   { transform: [{ rotate: "25deg" }] },
        },
        animationIterationCount: 4,
        animationDuration: "300ms",
      }}
    ></Animated.Text>
  );
}
