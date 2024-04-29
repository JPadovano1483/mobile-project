import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { useState, useEffect } from 'react';

export default function App() {
  const [userInfo, setUserInfo] = useState({});
  const [topArtists, setTopArtists] = useState(null);

  const clientId = 'f115301a1fd94d0390bdeb56315bafc9'; 
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");

  useEffect(() => {
    async function fetchData() {
      if (!code) {
          redirectToAuthCodeFlow(clientId);
      } else {
          const accessToken = await getAccessToken(clientId, code);
          const profile = await fetchProfile(accessToken);
          console.log(profile);
          // populateUI(profile);
          setUserInfo(profile);
      }
    }

    fetchData();
  }, [])


  async function redirectToAuthCodeFlow(clientId) {
    const verifier = generateCodeVerifier(128);
    const challenge = await generateCodeChallenge(verifier);

    localStorage.setItem("verifier", verifier);

    const params = new URLSearchParams();
    params.append("client_id", clientId);
    params.append("response_type", "code");
    params.append("redirect_uri", "http://localhost:8081/callback");
    params.append("scope", "user-read-private user-read-email");
    params.append("code_challenge_method", "S256");
    params.append("code_challenge", challenge);

    document.location = `https://accounts.spotify.com/authorize?${params.toString()}`;
  }

  function generateCodeVerifier(length) {
    let text = '';
    let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }

  async function generateCodeChallenge(codeVerifier) {
    const data = new TextEncoder().encode(codeVerifier);
    const digest = await window.crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode.apply(null, [...new Uint8Array(digest)]))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
  }

  async function getAccessToken(clientId, code) {
    const verifier = localStorage.getItem("verifier");

    const params = new URLSearchParams();
    params.append("client_id", clientId);
    params.append("grant_type", "authorization_code");
    params.append("code", code);
    params.append("redirect_uri", "http://localhost:8081/callback");
    params.append("code_verifier", verifier);

    const result = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params
    });

    const { access_token } = await result.json();
    return access_token;
  }

  async function fetchProfile(token) {
    const result = await fetch("https://api.spotify.com/v1/me/top/tracks?limit=5", {
        method: "GET", headers: { Authorization: `Bearer ${token}` }
    });

    return await result.json();
  }

  function populateUI(profile) {
    document.getElementById("displayName").innerText = profile.display_name;
    if (profile.images[0]) {
        const profileImage = new Image(200, 200);
        profileImage.src = profile.images[0].url;
        document.getElementById("avatar").appendChild(profileImage);
        document.getElementById("imgUrl").innerText = profile.images[0].url;
    }
    document.getElementById("id").innerText = profile.id;
    document.getElementById("email").innerText = profile.email;
    document.getElementById("uri").innerText = profile.uri;
    document.getElementById("uri").setAttribute("href", profile.external_urls.spotify);
    document.getElementById("url").innerText = profile.href;
    document.getElementById("url").setAttribute("href", profile.href);
  }

  return (
    <View style={styles.container}>
      <h1>Display your Spotify profile data</h1>

      <section id="profile">
      <h2>Logged in as <span id="displayName">{userInfo.display_name}</span></h2>
      <span id="avatar"></span>
      <ul>
          <li>User ID: <span id="id">{userInfo.id}</span></li>
          <li>Email: <span id="email">{userInfo.email}</span></li>
          <li>Spotify URI: <a id="uri" href="#">{userInfo.uri}</a></li>
          <li>Link: <a id="url" href="#">{userInfo.href}</a></li>
      </ul>
      </section>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
