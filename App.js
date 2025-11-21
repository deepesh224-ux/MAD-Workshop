import { StatusBar } from "expo-status-bar";
import { useState, useEffect } from "react";
import { View, StyleSheet, Dimensions, Text,TouchableWithoutFeedback } from "react-native";
import { Accelerometer } from 'expo-sensors';
import { Image } from "react-native";
import { Platform } from "react-native";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
const PLAYER_WIDTH = 80;
const PLAYER_HEIGHT = 80;

const BULLET_WIDTH = 10;
const BULLET_HEIGHT = 20;

const BLOCK_WIDTH = 70;
const BLOCK_HEIGHT = 70;

export default function App() {
  const [playerX, setPlayerX] = useState((screenWidth - PLAYER_WIDTH) / 2);
  const [bullets, setBullets] = useState([]);
  const [box, setbox] = useState([]);
  const [roadY, setRoadY] = useState(0);
  const [intervalId, setIntervalId] = useState(null);


  useEffect(() => {
  const interval = setInterval(() => {
        setRoadY(prev => (prev + 5) % screenHeight);
      }, 15);

      return () => clearInterval(interval);
    }, []);

  useEffect(() => {
    Accelerometer.setUpdateInterval(16); // roughly 60Hz
    const subscription = Accelerometer.addListener(({x})=>{
      const move = (Platform.OS === "android" ? -x : x) * 30; // scale factor for sensitivity
      setPlayerX(prevX => {
        const newX = prevX + move;
        if (newX < 0) return 0;
        if (newX + PLAYER_WIDTH > screenWidth) return screenWidth - PLAYER_WIDTH;
        return newX;
      })
    })
    return () => subscription.remove()
  }, []);



  useEffect(() => {
  const interval = setInterval(() => {
    setbox(prevBox =>
      prevBox
        .map(block => ({ ...block, y: block.y - 5 }))
        .filter(block => {

          // Check collision with bullets
          const hit = bullets.some(bullet => {
            const bulletBottom = bullet.y;
            const bulletLeft = bullet.x;
            const bulletRight = bullet.x + BULLET_WIDTH;

            const blockTop = block.y + BLOCK_HEIGHT;
            const blockLeft = block.x;
            const blockRight = block.x + BLOCK_WIDTH;

            // rectangle collision
            return (
              bulletBottom >= block.y &&
              bulletBottom <= blockTop &&
              bulletRight >= blockLeft &&
              bulletLeft <= blockRight
            );
          });

          // Keep block only if it's on screen and NOT hit
          return block.y + BLOCK_HEIGHT > 0 && !hit;
        })
    );
    setBullets(prevBullets =>
    prevBullets
      .map(bullet => ({ ...bullet, y: bullet.y + 10 }))
      .filter(bullet => {
        const hit = box.some(block => {
          return (
            bullet.y >= block.y &&
            bullet.y <= block.y + BLOCK_HEIGHT &&
            bullet.x + BULLET_WIDTH >= block.x &&
            bullet.x <= block.x + BLOCK_WIDTH
          );
        });
        return bullet.y < screenHeight && !hit;  // ✔ FIXED
      })
  );

  }, 15);

  return () => clearInterval(interval);
}, [bullets,box]);


  const handleBullet = () => {
    const bullet ={
      id: Date.now(),
      x: playerX + (PLAYER_WIDTH - BULLET_WIDTH) / 2,
      y: 20 + PLAYER_HEIGHT,
    }
    
    setBullets(prevBullets => [...prevBullets, bullet]);
   
  }
  useEffect(() => {
    const id=setInterval(() => {   
      const box ={
        id: Date.now(),
        x:Math.random() * (screenWidth - BLOCK_WIDTH),
        y:screenHeight,
      }
      setbox(prevbox => [...prevbox, box]);
    }, 2000);
    return ()=>clearInterval(id);
  }, []);

  
  return (
    <TouchableWithoutFeedback onPress={handleBullet}>
    <View style={styles.container}>
      <Image
        source={require("./assets/road.png")}
        style={[styles.road, { top: roadY - screenHeight }]}
      />
      <Image
        source={require("./assets/road.png")}
        style={[styles.road, { top: roadY }]}
      />
      {
        bullets.map(bullet => (
          <View key={bullet.id} style={[styles.bullet, { left: bullet.x, bottom: bullet.y }]} />
        ))
      }
      {
          box.map(box => (
            <Image
              key={box.id}
              source={require("./assets/vehicle.png")}   // your image file
              style={[styles.vehicle, { left: box.x, bottom: box.y }]}
            />
          ))
 
      }
      <Image
        source={require("./assets/player.png")}   // your player image
        style={[styles.playerImage, { left: playerX }]}
      />
      <Text style={styles.instruction}>Tilt your phone to move</Text>
    </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: 60,
  },
  player: {
    position: "absolute",
    bottom: 20,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
    backgroundColor: "#FFF",
    borderWidth: 2,
    borderColor: "#000",
  },
  instruction: {
    position: "absolute",
    top: 70,
    color: "#fff",
    fontFamily: "Courier",
    fontSize: 14,
  },
  bullet: {
    position: "absolute",
    width: BULLET_WIDTH,
    height: BULLET_HEIGHT,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#000",
  },
  fallingBlock: {
    position: "absolute",
    width: BLOCK_WIDTH,
    height: BLOCK_HEIGHT,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "black",
  },
  gameOverText: {
    position: "absolute",
    top: screenHeight / 2 - 40,
    color: "#FFF",
    fontSize: 24,
    fontWeight: "bold",
    fontFamily: "Courier",
  },
  vehicle: {
  position: "absolute",
  width: BLOCK_WIDTH,
  height: BLOCK_HEIGHT,
  resizeMode: "contain",
},playerImage: {
  position: "absolute",
  bottom: 20,
  width: PLAYER_WIDTH,
  height: PLAYER_HEIGHT,
  resizeMode: "contain",
},road: {
  position: "absolute",
  width: screenWidth,
  height: screenHeight,
  resizeMode: "stretch",
},

});
