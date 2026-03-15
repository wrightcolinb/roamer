"use client";

import { useEffect, useState, useCallback } from "react";
import Map from "@/components/Map";
import SearchBar from "@/components/SearchBar";
import Sidebar from "@/components/Sidebar";
import { supabase } from "@/lib/supabase";
import type { Destination } from "@/lib/types";

export default function Home() {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null);
  const [flyTo, setFlyTo] = useState<{ lng: number; lat: number } | null>(null);

  useEffect(() => {
    async function fetchDestinations() {
      const { data } = await supabase.from("destinations").select("*");
      if (data) setDestinations(data as Destination[]);
    }
    fetchDestinations();
  }, []);

  const handleAdd = useCallback((destination: Destination) => {
    setDestinations((prev) => [...prev, destination]);
    setFlyTo({ lng: destination.lng, lat: destination.lat });
  }, []);

  const handleUpdate = useCallback((updated: Destination) => {
    setDestinations((prev) =>
      prev.map((d) => (d.id === updated.id ? updated : d))
    );
    setSelectedDestination(updated);
  }, []);

  const handleDelete = useCallback((id: string) => {
    setDestinations((prev) => prev.filter((d) => d.id !== id));
    setSelectedDestination(null);
  }, []);

  return (
    <main className="relative h-screen w-screen overflow-hidden">
      <Map
        destinations={destinations}
        onPinClick={setSelectedDestination}
        onMapClick={() => setSelectedDestination(null)}
        onAdd={handleAdd}
        flyTo={flyTo}
      />
      <SearchBar onAdd={handleAdd} />
      <Sidebar
        destination={selectedDestination}
        onClose={() => setSelectedDestination(null)}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
      />
    </main>
  );
}
