import React from "react";
import MeetupList from "../components/MeetupList";

interface Props {
  meetups: any[];
  filteredMeetups: any[];
  selectedCity: "all" | "HCM" | "HN";
  selectedDistance: "all" | "5" | "10";
  userLat: number | null;
  userLng: number | null;
  isTrackingGPS: boolean;
  gpsError: boolean;
  isLoading?: boolean;
}

export default function FindRoute({
  meetups,
  filteredMeetups,
  selectedCity = "all",
  selectedDistance = "all",
  userLat,
  userLng,
  isTrackingGPS,
  gpsError,
  isLoading = false,
}: Props) {
  return (
    <section id="find-route" className="pb-10">
      <h2 className="section-title">Tìm kèo xung quanh</h2>
      <MeetupList
        meetups={filteredMeetups}
        userLat={userLat}
        userLng={userLng}
        selectedCity={selectedCity}
        selectedDistance={selectedDistance}
        isTrackingGPS={isTrackingGPS}
        gpsError={gpsError}
        isLoading={isLoading}
      />
    </section>
  );
}
