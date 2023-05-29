import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./Map.css";
import Header from "../../Components/Header/Header";
import Footer from "../../Components/Footer/Footer";
import StrokeButton from "../../Components/Button/StrokeButton";
import axios from "axios";

const { kakao } = window;

const Map = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const mode = location.state.mode;
  const title = "지도";
  const dup = new Set();
  const token = sessionStorage.getItem("token");
  const address = process.env.REACT_APP_ADDRESS;

  // 기본 마커
  const markerSrc = process.env.PUBLIC_URL + "/Images/Map/MarkerIcon.svg";
  const Marker = new kakao.maps.MarkerImage(
    markerSrc,
    new kakao.maps.Size(24, 35)
  );

  // 24시간 야간 공부 장소 마커
  const starMarkerSrc =
    process.env.PUBLIC_URL + "/Images/Map/StarMarkerIcon.svg";
  const starMarker = new kakao.maps.MarkerImage(
    starMarkerSrc,
    new kakao.maps.Size(24, 35)
  );

  let map;

  const getMyPos = async () => {
    // 시간이 조금 걸림. 로딩 화면 띄우면 좋을듯
    try {
      let { coords } = await new Promise((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej)
      );
      return { lat: coords.latitude, lng: coords.longitude };
    } catch (err) {
      console.log(err);
      return { lat: 33.450701, lng: 126.570667 };
    }
  };

  const setPos2MyPos = async () => {
    // 시간이 조금 걸림. 로딩 화면 띄우면 좋을듯
    let pos = await getMyPos();
    map.setCenter(new kakao.maps.LatLng(pos.lat, pos.lng));
  };

  // 지도 그리기 함수
  const draw = async () => {
    let center = map.getCenter();
    let bounds = map.getBounds();
    let swLatLng = bounds.getSouthWest();
    let neLatLng = bounds.getNorthEast();

    let { data } = await axios.post(
      `${address}/api/${mode}`,
      {
        coord: {
          lat: center.getLat(),
          lng: center.getLng(),
        },
        boundary: [
          { lat: swLatLng.getLat(), lng: swLatLng.getLng() },
          { lat: neLatLng.getLat(), lng: neLatLng.getLng() },
        ],
        only24: false,
      },
      {
        headers: {
          Authorization: `${token}`,
        },
      }
    );
    data.forEach((e) => {
      if (dup.has(e.id)) return;
      dup.add(e.id);
      let config = {
        position: new kakao.maps.LatLng(e.lat, e.lng),
        clickable: true,
        image: Marker,
      };
      if (e.is24) config.image = starMarker;
      let marker = new kakao.maps.Marker(config);
      marker.setMap(map);

      // 커스텀 오버레이 생성
      let iwContent =
        '<div class="customoverlay">' +
        '  <a href="/place?name=' +
        encodeURIComponent(e.name) +
        "&address=" +
        encodeURIComponent(e.address) +
        "&mode=" +
        encodeURIComponent(mode) +
        '">' +
        '    <span class="title">' +
        e.name +
        "</span>" +
        '    <span class="title">' +
        e.address +
        "</span>" +
        "  </a>" +
        "</div>";

      let infowindow = new kakao.maps.CustomOverlay({
        map: map,
        position: config.position,
        content: iwContent,
        removable: true,
      });
    });
  };

  useEffect(() => {
    const container = document.getElementById("myMap");
    const options = {
      center: new kakao.maps.LatLng(33.450701, 126.570667),
      level: 3,
      isPanto: true,
    };
    map = new kakao.maps.Map(container, options);

    let delay = false;
    kakao.maps.event.addListener(map, "center_changed", () => {
      if (delay) clearTimeout(delay);
      delay = setTimeout(() => {
        delay = false;
        draw();
      }, 500);
    });
    setPos2MyPos().then(() => draw());
  }, []);

  return (
    <>
      <Header title={title} />
      <div
        id="myMap"
        style={{
          width: "100%",
          height: "100vh",
        }}
      ></div>
      <StrokeButton
        position={"absolute"}
        color={"#ffffff"}
        src={process.env.PUBLIC_URL + "/Images/Map/CurrentIcon.svg"}
        onClick={setPos2MyPos}
      />
      <Footer title={title} />
    </>
  );
};

export default Map;
