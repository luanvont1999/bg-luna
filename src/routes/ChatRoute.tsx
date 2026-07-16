import React from "react";
import ChatView from "../components/ChatView";
import { goBack } from "../libs/router";

interface Meetup {
  id: string;
  title: string;
  game: string;
  host_name?: string;
  hostName?: string;
  host_uid?: string;
  hostUid?: string;
  approvedUids?: string[];
  color?: string;
}

interface Props {
  meetup: Meetup | null;
}

export default function ChatRoute({ meetup }: Props) {
  return <ChatView meetup={meetup} onBack={goBack} />;
}
