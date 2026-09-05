import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";

export type PlaceMark = { id: string; catalog_place_id: string };

/** Loves and "already done" marks of the signed-in traveller, plus their toggles. */
export function usePlaceMarks() {
  const { user } = useSession();
  const queryClient = useQueryClient();
  const enabled = Boolean(user);

  const favorites = useQuery({
    queryKey: ["favorites", user?.id],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase.from("favorites").select("id, catalog_place_id");
      if (error) throw error;
      return (data ?? []) as PlaceMark[];
    },
  });

  const visited = useQuery({
    queryKey: ["visited-places", user?.id],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase.from("visited_places").select("id, catalog_place_id");
      if (error) throw error;
      return (data ?? []) as PlaceMark[];
    },
  });

  function refresh() {
    void queryClient.invalidateQueries({ queryKey: ["favorites", user?.id] });
    void queryClient.invalidateQueries({ queryKey: ["favorites-full"] });
    void queryClient.invalidateQueries({ queryKey: ["visited-places", user?.id] });
  }

  const toggleFavorite = useMutation({
    mutationFn: async (placeId: string) => {
      if (!user) throw new Error("Connectez-vous pour aimer un lieu");
      const existing = (favorites.data ?? []).find((row) => row.catalog_place_id === placeId);
      if (existing) {
        const { error } = await supabase.from("favorites").delete().eq("id", existing.id);
        if (error) throw error;
        return "removed" as const;
      }
      const { error } = await supabase
        .from("favorites")
        .insert({ catalog_place_id: placeId, user_id: user.id });
      if (error) throw error;
      return "added" as const;
    },
    onSuccess: refresh,
  });

  const toggleVisited = useMutation({
    mutationFn: async (placeId: string) => {
      if (!user) throw new Error("Connectez-vous pour marquer un lieu comme fait");
      const existing = (visited.data ?? []).find((row) => row.catalog_place_id === placeId);
      if (existing) {
        const { error } = await supabase.from("visited_places").delete().eq("id", existing.id);
        if (error) throw error;
        return "removed" as const;
      }
      const { error } = await supabase
        .from("visited_places")
        .insert({ catalog_place_id: placeId, user_id: user.id });
      if (error) throw error;
      return "added" as const;
    },
    onSuccess: refresh,
  });

  const favoriteIds = new Set((favorites.data ?? []).map((row) => row.catalog_place_id));
  const visitedIds = new Set((visited.data ?? []).map((row) => row.catalog_place_id));

  return { user, favoriteIds, visitedIds, toggleFavorite, toggleVisited };
}
