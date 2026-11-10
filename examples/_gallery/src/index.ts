import "./index.css";
import manifestJson from "./manifest.json";
import { createGallery } from "./gallery";
import type { Manifest } from "./gallery";

const root = document.getElementById("root");
if (root) createGallery(root, manifestJson as unknown as Manifest);
