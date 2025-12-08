import { useEffect, useRef } from "react";

// 👇 이 코드 딱 한 줄 추가
declare global {
  interface Window {
    kakao: any;
  }
}

const KakaoMap = ({ lat, lng }: { lat: number; lng: number }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
const KAKAO_JS_KEY = import.meta.env.VITE_KAKAO_MAP_JS_KEY;

  useEffect(() => {
    const script = document.createElement("script");
script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_JS_KEY}&autoload=false`;
    script.async = true;

    script.onload = () => {
      window.kakao.maps.load(() => {
        if (!mapContainer.current) return;

        const center = new window.kakao.maps.LatLng(lat, lng);

        const map = new window.kakao.maps.Map(mapContainer.current, {
          center,
          level: 3,
        });

        // 마커
        new window.kakao.maps.Marker({ map, position: center });
      });
    };

    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, [lat, lng]);

  return (
    <div
      ref={mapContainer}
      style={{ width: "100%", height: "300px", borderRadius: "10px" }}
    />
  );
};

export default KakaoMap;
