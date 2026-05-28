export function roomTypeForName(name) {
  if (/厨/.test(name)) return "kitchen";
  if (/阳台|露台/.test(name)) return "balcony";
  if (/卧|睡|衣帽/.test(name)) return "bedroom";
  return "living";
}

export function createLocationDomain({ clampBox, createId, normalizeImageMeta, seedState }) {
  function normalizePlace(place = {}) {
    const name = String(place.name || "未命名储物点").trim();
    return {
      id: place.id || createId("place", name),
      name,
      shortName: place.shortName || name,
      kind: place.kind || "photo",
      parentId: place.parentId || null,
      sourceItemId: place.sourceItemId || null,
      box: clampBox(place.box || { x: 16, y: 18, w: 36, h: 24 }),
      image: place.image || null,
      imageRef: place.imageRef || null,
      imageMeta: normalizeImageMeta(place.imageMeta),
      note: place.note || "储物点",
    };
  }

  function normalizeRooms(rooms) {
    const fallbackRooms = structuredClone(seedState.rooms);
    const sourceRooms = Array.isArray(rooms) && rooms.length ? rooms : fallbackRooms;
    return sourceRooms.map((room, index) => {
      const fallback = fallbackRooms[index] || fallbackRooms[0];
      return {
        id: room.id || fallback.id || createId("room", room.name || "空间"),
        name: room.name || fallback.name || "空间",
        type: room.type || roomTypeForName(room.name || fallback.name || ""),
        places: Array.isArray(room.places)
          ? room.places.map((place) => normalizePlace(place))
          : [],
      };
    });
  }

  return {
    normalizePlace,
    normalizeRooms,
    roomTypeForName,
  };
}
