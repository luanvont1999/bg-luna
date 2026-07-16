import React from "react";
import MeetupList from "../components/MeetupList";
import { navigate } from "../libs/router";
import Icon from "../components/Icon";

interface Props {
  meetups: any[];
  filteredMeetups: any[];
  selectedCities: ("HCM" | "HN" | "OTHER")[];
  selectedDistance: string;
  userLat: number | null;
  userLng: number | null;
  isTrackingGPS: boolean;
  gpsError: boolean;
  isLoading?: boolean;
}

export default function FindRoute({
  meetups,
  filteredMeetups,
  selectedCities = [],
  selectedDistance = "all",
  userLat,
  userLng,
  isTrackingGPS,
  gpsError,
  isLoading = false,
}: Props) {
  return (
    <section id="find-route" className="pb-10 flex flex-col gap-4 text-left">
      <div className="flex justify-between items-center w-full flex-wrap gap-2.5">
        <h2 className="section-title m-0 text-[1.5rem] font-extrabold text-[#1e1e24]">
          Tìm kèo xung quanh
        </h2>
        <button
          type="button"
          className="btn btn-secondary action-sm-button flex items-center gap-1.5 py-2  font-bold bg-pastelYellow text-[#1e1e24] border-3 border-[#1e1e24] rounded-lg shadow-[3px_3px_0_#1e1e24] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4.5px_4.5px_0_#1e1e24] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_#1e1e24] transition-all"
          onClick={() => navigate({ name: "filter" })}
        >
          <Icon name="filter" size={24} />
        </button>
      </div>

      <MeetupList
        meetups={filteredMeetups}
        userLat={userLat}
        userLng={userLng}
        selectedCities={selectedCities}
        selectedDistance={selectedDistance}
        isTrackingGPS={isTrackingGPS}
        gpsError={gpsError}
        isLoading={isLoading}
      />
    </section>
  );
}
