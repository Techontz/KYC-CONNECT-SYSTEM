"use client";

import { useMe } from "@/lib/hooks";
import { isStaff } from "@/lib/roles";
import { StaffDashboard } from "@/components/dashboard/StaffDashboard";
import { RiderHome } from "@/components/dashboard/RiderHome";

export default function HomePage() {
  const me = useMe();
  if (!me.data) return null;
  return isStaff(me.data) ? <StaffDashboard me={me.data} /> : <RiderHome me={me.data} />;
}
