"use client";

import { useApi } from "./hooks";
import type { Group, ID, ListResponse, Organisation, ParkingPoint } from "./types";

export function useOrganisations() {
  return useApi<ListResponse<Organisation>>("/organisations", { perPage: 100 }, { staleTime: 5 * 60_000 });
}

export function useGroups(orgId?: ID | null) {
  return useApi<ListResponse<Group>>(orgId ? `/organisations/${orgId}/groups` : null, { perPage: 100 }, { staleTime: 5 * 60_000 });
}

export function useParkingPoints(orgId?: ID | null) {
  return useApi<ListResponse<ParkingPoint>>(orgId ? `/organisations/${orgId}/parking-points` : null, { perPage: 100 }, { staleTime: 5 * 60_000 });
}
