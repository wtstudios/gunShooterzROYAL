let resizeTimer;
window.addEventListener("resize", () => {
  document.body.classList.add("resize-animation-stopper");
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    document.body.classList.remove("resize-animation-stopper");
  }, 400);
});

window.addEventListener("contextmenu", e => e.preventDefault());

function requestConnectToGame() {
  let platform;
  if (navigator.userAgent.match(/Android/i)
  || navigator.userAgent.match(/webOS/i)
  || navigator.userAgent.match(/iPhone/i)
  || navigator.userAgent.match(/iPad/i)
  || navigator.userAgent.match(/iPod/i)
  || navigator.userAgent.match(/BlackBerry/i)
  || navigator.userAgent.match(/Windows Phone/i)) {
    platform = "mobile";
  } else {
    platform = "desktop";
  }
  socket.emit("play-request", {platform: platform});
  let fs = fullscreen();
  fullscreen(!fs);
}

function squaredDist(ptA, ptB) {
  return (ptB.x - ptA.x) ** 2 + (ptB.y - ptA.y) ** 2;
}

function secondsToTimestamp(seconds) {
  if(seconds <= 0) {
    return "0:00";
  }
  if(seconds - Math.floor(seconds / 60) * 60 < 10) {
    return Math.floor(gameData.secondsLeft / 60) + ":0" + (gameData.secondsLeft - (Math.floor(gameData.secondsLeft / 60) * 60));
  } else {
    return Math.floor(gameData.secondsLeft / 60) + ":" + (gameData.secondsLeft - (Math.floor(gameData.secondsLeft / 60) * 60));
  }
}

function displayParticles() {
  for(let i = 0; i < gameData.particles.length; i++) { 
    const particleData = gameData.particles[i],
    opacity = Math.round(255 - (mostRecentMS - particleData.timeStamp) / 2) + 1;
    if(opacity <= -1) {
      gameData.particles.splice(i, 1);
      i--;
    } else {
      push();
      translate(particleData.position.x + Math.cos(particleData.angle) * (mostRecentMS - particleData.timeStamp) * 3, particleData.position.y + Math.sin(particleData.angle) * (mostRecentMS - particleData.timeStamp) * 3);
      rotate(particleData.rotation / Math.PI * 180);
      tint(255, 255, 255);
      image(assetsLoaded[particleData.src], 0, 0, particleData.size, particleData.size);
      pop();
    }
  }
}

function displayObstacles() {
  const player = gameData.players[permanentID];
  for (let i = 0; i < player.state.objectRenderList.length; i++) {
    const obstacleData = gameData.mapData.obstacles[player.state.objectRenderList[i]];
    push();
    translate(obstacleData["body-data"].position.x + obstacleData["display-data"]["offset"].x, obstacleData["body-data"].position.y + obstacleData["display-data"]["offset"].y);
    rotate(obstacleData["display-data"]["offset"].angle);
    image(assetsLoaded[obstacleData["display-data"].src], 0, 0, obstacleData["display-data"].dimensions.width, obstacleData["display-data"].dimensions.height);
    pop();
  }
}

function displayGuns() {
  for (let i = 0; i < gameData.users.length; i++) {
    if(gameData.players[gameData.users[i]].health > 0) {
      const playerData = gameData.players[gameData.users[i]],
      gun = gameData.weapons[playerData.guns[playerData.state.activeWeaponIndex]],
      tickDelay = mostRecentMS - gameData.timeStamp;
      push();
      translate(playerData.state.previousPosition.x + playerData.state.force.x * (tickDelay / gameData.lastTickDelay), playerData.state.previousPosition.y + playerData.state.force.y * (tickDelay / gameData.lastTickDelay));
      if(false) {
        // عبد الله عياد لا يريد شيئاً من هذا
      } else {
        const oldAngleVector = {
          x: Math.cos(playerData.state.previousAngle * Math.PI / 180),
          y: Math.sin(playerData.state.previousAngle * Math.PI / 180)
        },
        newAngleVector = {
          x: Math.cos(playerData.state.angle * Math.PI / 180),
          y: Math.sin(playerData.state.angle * Math.PI / 180)
        }
        rotate(Math.atan2(oldAngleVector.y + (newAngleVector.y - oldAngleVector.y) * (tickDelay / gameData.lastTickDelay), oldAngleVector.x + (newAngleVector.x - oldAngleVector.x) * (tickDelay / gameData.lastTickDelay)) / Math.PI * 180 - 90);
      }
      scale(0.7);
      image(assetsLoaded[gun.images.topdownSRC], gun.images.offset.x + playerData.state.recoilTimer * gun.recoilImpulse[2].x, gun.images.offset.y + playerData.state.recoilTimer * gun.recoilImpulse[2].y);
      scale(1 / 0.7);
      for (let j = 0; j < gun.handPositions.length; j++) {
        image(assetsLoaded["/assets/player/player-hand.svg"], gun.handPositions[j].x + playerData.state.recoilTimer * (gun.recoilImpulse[j].x * 0.7), gun.handPositions[j].y + playerData.state.recoilTimer * (gun.recoilImpulse[j].y * 0.7), 100, 100);
      }
      pop();
    }
  }
}

function displayBullets() {
  for (let i = 0; i < gameData.bullets.length; i++) {
    const bullet = gameData.bullets[i],
    opacity = Math.round((-(mostRecentMS - bullet.timeStamp) / 3) + (bullet.timeLeft * 6));
    if(opacity <= 1) {
      gameData.bullets.splice(i, 1);
      i--;
    } else {
      push();
      imageMode(CORNER);
      translate(bullet.coordinates.finish.x, bullet.coordinates.finish.y);
      tint(255, 255, 255, (bullet.timeLeft / 25) * opacity);
      rotate(bullet.angle - 90);
      image(assetsLoaded["/assets/weapons/bullet.svg"], -12.5, -5, 25, bullet.tracerLength + 5);
      imageMode(CENTER);
      pop();
    }
  }
}

function displayPlayers() {
  for (let i = 0; i < gameData.users.length; i++) {
    if(gameData.players[gameData.users[i]].health > 0) {
      const playerData = gameData.players[gameData.users[i]],
      tickDelay = mostRecentMS - gameData.timeStamp;
      push();
      translate(playerData.state.previousPosition.x + playerData.state.force.x * (tickDelay / gameData.lastTickDelay), playerData.state.previousPosition.y + playerData.state.force.y * (tickDelay / gameData.lastTickDelay));
      if(gameData.users[i] == permanentID) {
        rotate(atan2(mouseY - height / 2, mouseX - width / 2) + 90);
      } else {
        const oldAngleVector = {
          x: Math.cos(playerData.state.previousAngle * Math.PI / 180),
          y: Math.sin(playerData.state.previousAngle * Math.PI / 180)
        },
        newAngleVector = {
          x: Math.cos(playerData.state.angle * Math.PI / 180),
          y: Math.sin(playerData.state.angle * Math.PI / 180)
        }
        rotate(Math.atan2(oldAngleVector.y + (newAngleVector.y - oldAngleVector.y) * (tickDelay / gameData.lastTickDelay), oldAngleVector.x + (newAngleVector.x - oldAngleVector.x) * (tickDelay / gameData.lastTickDelay)) / Math.PI * 180 - 90);
      }
      image(assetsLoaded["/assets/player/player-base.svg"], 0, 0, 250, 250);
      if(gameData.users[i] != permanentID) {
        const oldAngleVector = {
          x: Math.cos(playerData.state.previousAngle * Math.PI / 180),
          y: Math.sin(playerData.state.previousAngle * Math.PI / 180)
        },
        newAngleVector = {
          x: Math.cos(playerData.state.angle * Math.PI / 180),
          y: Math.sin(playerData.state.angle * Math.PI / 180)
        }
        rotate(-(Math.atan2(oldAngleVector.y + (newAngleVector.y - oldAngleVector.y) * (tickDelay / gameData.lastTickDelay), oldAngleVector.x + (newAngleVector.x - oldAngleVector.x) * (tickDelay / gameData.lastTickDelay)) / Math.PI * 180 - 90));
        fill(255 - (playerData.health / 100) * 255, (playerData.health / 100) * 255, 0);
        textFont(sourceSansPro);
        textAlign(CENTER);
        textSize(100);
        text(playerData.name, 0, 0);
      }
      pop();
    }
  }
}

function interpolateCamera() {
  const playerData = gameData.players[permanentID],
  tickDelay = mostRecentMS - gameData.timeStamp;
  queuedCameraLocation.x = playerData.state.previousPosition.x + playerData.state.force.x * (tickDelay / gameData.lastTickDelay);
  queuedCameraLocation.y  = playerData.state.previousPosition.y + playerData.state.force.y * (tickDelay / gameData.lastTickDelay);
  queuedCameraLocation.targetX = playerData.state.previousPosition.x + playerData.state.force.x * (tickDelay / gameData.lastTickDelay);
  queuedCameraLocation.targetY  = playerData.state.previousPosition.y + playerData.state.force.y * (tickDelay / gameData.lastTickDelay);
}

function displayWorld() {
  if (assetsAreLoaded) {
    mostRecentMS = Date.now();
    interpolateCamera();
    cameraLocation = queuedCameraLocation;
    camera(cameraLocation.x/* + (mouseX - width / 2) / 2*/, cameraLocation.y/* + (mouseY - height / 2) / 2*/, cameraLocation.z, cameraLocation.targetX/* + (mouseX - width / 2) / 2*/, cameraLocation.targetY/* + (mouseY - height / 2) / 2*/, cameraLocation.targetZ);
    background(gameData.mapData.config["background-colour"]);
    //fill(gameData.mapData.config["ground-colour"]);
    rectMode(CORNER);
    //rect(0, 0, gameData.mapData.config["map-dimensions"].width, gameData.mapData.config["map-dimensions"].height, 150);
    image(assetsLoaded[gameData.mapData.config["ground-image"]], gameData.mapData.config["map-dimensions"].width / 2, gameData.mapData.config["map-dimensions"].height / 2, gameData.mapData.config["map-dimensions"].width, gameData.mapData.config["map-dimensions"].height);
    rectMode(CENTER);
    displayBullets();
    displayGuns();
    displayPlayers();    displayObstacles();
    displayObstacles();
    displayObstacles();
    displayObstacles();
    displayObstacles();
    displayObstacles();    displayObstacles();
    displayObstacles();
    displayParticles();
    displayObstacles();
    displayObstacles();
    displayObstacles();
    displayObstacles();
    displayObstacles();    displayObstacles();
    displayObstacles();    displayObstacles();    displayObstacles();    displayObstacles();
    displayObstacles();
    displayObstacles();
    displayObstacles();
    displayObstacles();
    displayObstacles();    displayObstacles();    displayObstacles();    displayObstacles();    displayObstacles();    displayObstacles();    displayObstacles();
    displayObstacles();    displayObstacles();    displayObstacles();
    displayObstacles();    displayObstacles();    displayObstacles();
    displayObstacles();
    displayObstacles();    displayObstacles();    displayObstacles();    displayObstacles();    displayObstacles();    displayObstacles();
    displayObstacles();
    displayObstacles();    displayObstacles();    displayObstacles();    displayObstacles();    displayObstacles();    displayObstacles();    displayObstacles();    displayObstacles();    displayObstacles();    displayObstacles();    displayObstacles();    displayObstacles();    displayObstacles();
    if(queuedCameraLocation.z != gameData.weapons[gameData.players[permanentID].guns[gameData.players[permanentID].state.activeWeaponIndex]].view + 2000) {
      queuedCameraLocation.z += Math.round((gameData.weapons[gameData.players[permanentID].guns[gameData.players[permanentID].state.activeWeaponIndex]].view + 2000 - queuedCameraLocation.z) / 6)
    }
    if(mouseX != pmouseX || mouseY != pmouseY) {
      socket.emit("angle-change", { angle: atan2(mouseY - height / 2, mouseX - width / 2) + 180, certificate: gameData.certificate });
    }
  }
}