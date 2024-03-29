import { Style } from "maplibre-gl/src";
import { Placement } from "maplibre-gl/src/symbol/placement";
import SourceCache from "./source_cache";

export function preprocessStyle(style) {
  if (typeof style !== "object") return;
  if (!Array.isArray(style.layers)) return;

  // minzoom/maxzoom to minzoom_/maxzoom_
  style.layers.forEach((layer) => {
    if (typeof layer.minzoom === "number") {
      layer.minzoom_ = layer.minzoom;
      delete layer.minzoom;
    }
    if (typeof layer.maxzoom === "number") {
      layer.maxzoom_ = layer.maxzoom;
      delete layer.maxzoom;
    }
  });

  // delete raster layer
  style.layers = style.layers.filter((l) => {
    return l.type !== "raster" && l.type !== "background";
  });
}

class BasicStyle extends Style {
  loadedPromise: Promise<void>;
  sourceCaches: any = {};
  constructor(stylesheet: any, map: any, options: any = {}) {
    super(map, options);

    this.loadedPromise = new Promise((res) =>
      this.on("style.load", (e) => res())
    );
    this.loadedPromise.then(() => {
      this.placement = new Placement(map.transform, 0, true);
    });
    this.loadJSON(stylesheet);
  }

  // @ts-ignore
  _createSourceCache(id, source) {
    return new SourceCache(id, source, this.dispatcher);
  }
  // setLayers, and all other methods on the super, e.g. setPaintProperty, should be called
  // via loadedPromise.then, not synchrounsouly

  setLayers(visibleLayerNames) {
    // Note this is not part of mapbox style, but handy to put it here for use with pending-style
    return Object.keys(this._layers).map((layerName) =>
      this.setLayoutProperty(
        layerName,
        "visibility",
        visibleLayerNames.includes(layerName) ? "visible" : "none"
      )
    );
  }
}

export default BasicStyle;
