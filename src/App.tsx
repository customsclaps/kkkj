import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import "./styles.css";
import SwipeableViews from "react-swipeable-views";
import { useSpring, animated, to } from "react-spring";
import { useGesture, useScroll } from "react-use-gesture";

const images = [
  "https://drscdn.500px.org/photo/126979479/w%3D440_h%3D440/v2?webp=true&v=2&sig=09ea71b0ddb91e24a59cecfb79a0189a2ab575d10372d3e8d3258e38f97a6a49",
  "https://drscdn.500px.org/photo/435236/q%3D80_m%3D1500/v2?webp=true&sig=67031bdff6f582f3e027311e2074be452203ab637c0bd21d89128844becf8e40",
  "https://drscdn.500px.org/photo/188823103/w%3D440_h%3D440/v2?webp=true&v=3&sig=af23265ed9beaeeeb12b4f8dfed14dd613e5139495ba4a80d5dcad5cef9e39fd",
  "https://drscdn.500px.org/photo/216094471/w%3D440_h%3D440/v2?webp=true&v=0&sig=16a2312302488ae2ce492fb015677ce672fcecac2befcb8d8e9944cbbfa1b53a",
  "https://drscdn.500px.org/photo/227760547/w%3D440_h%3D440/v2?webp=true&v=0&sig=d00bd3de4cdc411116f82bcc4a4e8a6375ed90a686df8488088bca4b02188c73",
  "https://drscdn.500px.org/photo/126979479/w%3D440_h%3D440/v2?webp=true&v=2&sig=09ea71b0ddb91e24a59cecfb79a0189a2ab575d10372d3e8d3258e38f97a6a49",
  "https://drscdn.500px.org/photo/435236/q%3D80_m%3D1500/v2?webp=true&sig=67031bdff6f582f3e027311e2074be452203ab637c0bd21d89128844becf8e40"
];

const centerDiv = (
  <div className="center-div">
    <span />
  </div>
);

const imageData = images.map((img) => (
  <img draggable={false} className="image" src={img} />
));

const PinchZoom: React.FC = ({ children }) => {
  const ref = useRef<HTMLDivElement>(null);
  const parentRef = useRef<HTMLDivElement>(null);
  const [boundingRect, setBoundingRect] = useState<DOMRect | null>(null);

  const [{ zoom, scale, x, y }, set] = useSpring(() => ({
    rotateX: 0,
    rotateY: 0,
    rotateZ: 0,
    scale: 1,
    x: 0,
    y: 0,
    zoom: 0,
    //config: { mass: 0, tension: 0, friction: 0 }
    config: { mass: 5, tension: 2000, friction: 200 }
  }));

  const [tap, setTap] = useState({ time: 0, doubleTap: false });

  const [drag, setDrag] = useState(false);
  const [pinch, setPinch] = useState(false);
  const [scrollPosition, setScrollPosition] = useState<[number, number] | null>(
    null
  );

  useScroll(
    ({ offset: [x, y] }) => {
      if (!drag && !pinch) {
        set({ x, y, immediate: true });
      }
    },
    { domTarget: parentRef }
  );

  const bind = useGesture(
    {
      onDragStart: () => setDrag(true),
      onDrag: ({ delta: [deltaX, deltaY], tap, timeStamp }) => {
        const parent = parentRef.current!;
        if (tap) {
          setTap(({ time }) => ({
            time: timeStamp,
            doubleTap: timeStamp - time < 300
          }));
        } else {
          const deltaXValue = deltaX * 10;
          const deltaYValue = deltaY * 10;
          const newX = x.get() - deltaXValue;
          const newY = y.get() - deltaYValue;
          const zoomValue = zoom.get();

          set({
            x: newX,
            y: newY
          });
        }
      },
      onDragEnd: () => {
        return setDrag(false);
      },
      onPinchStart: ({ event, origin: [originX, originY] }) => {
        setPinch(true);
        const zoomValue = zoom.get();

        const parent = parentRef.current!;
        const rect = boundingRect!;
        const scrollLeft = parent.scrollLeft;
        const scrollTop = parent.scrollTop;

        if (zoomValue === 0) {
          setScrollPosition([scrollLeft, scrollTop]);
        } else {
          setScrollPosition([
            (scrollLeft - (originX - rect.x) * zoomValue) / (zoomValue + 1),
            (scrollTop - (originY - rect.y) * zoomValue) / (zoomValue + 1)
          ]);
        }
      },
      onPinchEnd: () => {
        setPinch(false);
        setScrollPosition(null);
      },
      onPinch: ({ offset: [d, a], event, origin: [originX, originY] }) => {
        if (scrollPosition) {
          const rect = boundingRect!;
          event.preventDefault();
          const zoom = Math.max(0, d / 100);

          const x = scrollPosition[0] * (zoom + 1) + (originX - rect.x) * zoom;
          const y = scrollPosition[1] * (zoom + 1) + (originY - rect.y) * zoom;

          set({ zoom, x, y });
        }
      },
      onMove: ({ xy: [px, py], dragging }) => !dragging && set({ scale: 1.0 })
    },
    { domTarget: ref, eventOptions: { passive: false } }
  );

  useEffect(bind as any, [bind]);

  useEffect(() => {
    if (ref.current) {
      setBoundingRect(ref.current.getBoundingClientRect());
    }
  }, [ref]);

  useEffect(() => {
    if (tap.doubleTap) {
      set({ zoom: 0 });
    }
  }, [tap.doubleTap, set]);

  return (
    <animated.div
      ref={parentRef}
      scrollLeft={x}
      scrollTop={y}
      style={{
        touchAction: (pinch && "none") || "initial",
        overflow: "auto",
        width: "100%",
        height: "100%",
        userSelect: "none"
      }}
    >
      <animated.div
        ref={ref}
        className={`${drag ? "dragging" : ""}`}
        style={{
          scale: to([scale, zoom], (s, z) => s + z),
          transformOrigin: "0 0"
        }}
      >
        {children}
      </animated.div>
    </animated.div>
  );
};

export default function App() {
  return (
    <div className="App">
      <SwipeableViews
        style={{
          border: "1px solid red",
          marginLeft: 20,
          marginTop: 20,
          width: 360,
          height: 360
        }}
        containerStyle={{ width: "100%", height: "100%" }}
        slideStyle={{ overflow: "hidden", display: "flex" }}
        enableMouseEvents
      >
        <PinchZoom>
          {centerDiv}
          {centerDiv}
          {imageData}
          {centerDiv}
        </PinchZoom>
        <PinchZoom>{imageData}</PinchZoom>
        <PinchZoom>{imageData}</PinchZoom>
      </SwipeableViews>
    </div>
  );
}
