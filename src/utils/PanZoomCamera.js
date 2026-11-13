const Clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export const ValidateBounds = (bounds) => {
  if (!bounds || ![bounds.MinX, bounds.MinY, bounds.MaxX, bounds.MaxY].every(Number.isFinite) || bounds.MaxX <= bounds.MinX || bounds.MaxY <= bounds.MinY) {
    throw new TypeError("PanZoomView Bounds must contain finite MinX/MinY/MaxX/MaxY with positive width and height.");
  }

  return bounds;
};

export const FitCamera = (bounds, size) => ({
  X: (bounds.MinX + bounds.MaxX) / 2,
  Y: (bounds.MinY + bounds.MaxY) / 2,
  Zoom: Math.min(size.Width / (bounds.MaxX - bounds.MinX), size.Height / (bounds.MaxY - bounds.MinY)),
});

export const CameraLimits = (bounds, size, minZoom, maxZoom = 4) => {
  if (!Number.isFinite(maxZoom) || maxZoom <= 0 || (minZoom !== undefined && (!Number.isFinite(minZoom) || minZoom <= 0 || minZoom > maxZoom))) {
    throw new TypeError("PanZoomView zoom limits must be positive finite numbers with MinZoom <= MaxZoom.");
  }

  return { Min: minZoom ?? Math.min(FitCamera(bounds, size).Zoom, maxZoom), Max: maxZoom };
};

export const ClampCamera = (camera, bounds, size, limits) => {
  if (!camera || ![camera.X, camera.Y, camera.Zoom].every(Number.isFinite) || camera.Zoom <= 0) {
    throw new TypeError("PanZoomView Camera must contain finite X/Y and a positive Zoom.");
  }

  const zoom = Clamp(camera.Zoom, limits.Min, limits.Max);
  const width = size.Width / zoom;
  const height = size.Height / zoom;
  const overlapX = Math.min(width, bounds.MaxX - bounds.MinX) * 0.2;
  const overlapY = Math.min(height, bounds.MaxY - bounds.MinY) * 0.2;

  return {
    X: Clamp(camera.X, bounds.MinX + overlapX - width / 2, bounds.MaxX - overlapX + width / 2),
    Y: Clamp(camera.Y, bounds.MinY + overlapY - height / 2, bounds.MaxY - overlapY + height / 2),
    Zoom: zoom,
  };
};

export const WorldPoint = (point, camera, size) => ({
  X: camera.X + (point.X - size.Width / 2) / camera.Zoom,
  Y: camera.Y + (point.Y - size.Height / 2) / camera.Zoom,
});

export const ZoomCamera = (camera, zoom, point, size) => {
  const world = WorldPoint(point, camera, size);

  return {
    X: world.X - (point.X - size.Width / 2) / zoom,
    Y: world.Y - (point.Y - size.Height / 2) / zoom,
    Zoom: zoom,
  };
};
