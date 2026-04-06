import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { useColors, useCreateColor, useUpdateColor, useDeleteColor } from "@/features/colors";
import type { Color } from "@ecommerce/shared-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

// Color conversion utilities
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("");
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  h /= 360;
  s /= 100;
  l /= 100;
  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}

function parseColorInput(value: string): string | null {
  const trimmed = value.trim().toLowerCase();
  
  // Hex format: #RGB, #RRGGBB
  if (/^#?([a-f\d]{3}|[a-f\d]{6})$/i.test(trimmed)) {
    let hex = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
    if (hex.length === 4) {
      hex = `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
    }
    return hex;
  }
  
  // RGB format: rgb(r, g, b) or r, g, b
  const rgbMatch = trimmed.match(/^rgb\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/);
  if (rgbMatch) {
    const [, r, g, b] = rgbMatch.map(Number);
    if (r <= 255 && g <= 255 && b <= 255) {
      return rgbToHex(r, g, b);
    }
  }
  
  // HSL format: hsl(h, s%, l%)
  const hslMatch = trimmed.match(/^hsl\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})%?\s*,\s*(\d{1,3})%?\s*\)$/);
  if (hslMatch) {
    const [, h, s, l] = hslMatch.map(Number);
    if (h <= 360 && s <= 100 && l <= 100) {
      const rgb = hslToRgb(h, s, l);
      return rgbToHex(rgb.r, rgb.g, rgb.b);
    }
  }
  
  return null;
}

export function ColorsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingColor, setEditingColor] = useState<Color | null>(null);
  const [colorValue, setColorValue] = useState("#000000");
  const [colorInput, setColorInput] = useState("");

  const { data: response, isLoading } = useColors();
  const createMutation = useCreateColor();
  const updateMutation = useUpdateColor();
  const deleteMutation = useDeleteColor();

  const colors = response?.data ?? [];

  // Sync color state when dialog opens
  useEffect(() => {
    if (isDialogOpen) {
      const hex = editingColor?.hex ?? "#000000";
      setColorValue(hex);
      setColorInput(hex);
    }
  }, [isDialogOpen, editingColor]);

  // Get RGB and HSL display values
  const rgb = hexToRgb(colorValue);
  const hsl = rgb ? rgbToHsl(rgb.r, rgb.g, rgb.b) : null;

  const handleColorInputChange = (value: string) => {
    setColorInput(value);
    const parsed = parseColorInput(value);
    if (parsed) {
      setColorValue(parsed);
    }
  };

  const handleColorPickerChange = (hex: string) => {
    setColorValue(hex);
    setColorInput(hex);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const body = {
      nameEn: formData.get("nameEn") as string,
      nameAr: formData.get("nameAr") as string,
      hex: colorValue,
    };

    try {
      if (editingColor) {
        await updateMutation.mutateAsync({ id: editingColor.id, body });
        toast.success("Color updated");
      } else {
        await createMutation.mutateAsync(body);
        toast.success("Color created");
      }
      setIsDialogOpen(false);
      setEditingColor(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this color?")) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Color deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  const openEdit = (color: Color) => {
    setEditingColor(color);
    setIsDialogOpen(true);
  };

  const openCreate = () => {
    setEditingColor(null);
    setIsDialogOpen(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Colors</h1>
          <p className="mt-1 text-muted-foreground">
            Manage product colors.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Color
        </Button>
      </div>

      <div className="mt-6 rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Preview</TableHead>
              <TableHead>Name (EN)</TableHead>
              <TableHead>Name (AR)</TableHead>
              <TableHead>Hex</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                </TableCell>
              </TableRow>
            ) : colors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No colors found.
                </TableCell>
              </TableRow>
            ) : (
              colors.map((color) => (
                <TableRow key={color.id}>
                  <TableCell>
                    <div
                      className="h-8 w-8 rounded-full border"
                      style={{ backgroundColor: color.hex }}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{color.nameEn}</TableCell>
                  <TableCell>{color.nameAr}</TableCell>
                  <TableCell className="font-mono text-sm">{color.hex}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(color)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(color.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingColor ? "Edit Color" : "Add Color"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="nameEn">Name (English)</Label>
                <Input
                  id="nameEn"
                  name="nameEn"
                  defaultValue={editingColor?.nameEn ?? ""}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="nameAr">Name (Arabic)</Label>
                <Input
                  id="nameAr"
                  name="nameAr"
                  defaultValue={editingColor?.nameAr ?? ""}
                  required
                  dir="rtl"
                />
              </div>
              <div className="grid gap-2">
                <Label>Color</Label>
                <div className="flex gap-3 items-start">
                  {/* Color Picker */}
                  <div className="flex flex-col items-center gap-2">
                    <input
                      type="color"
                      value={colorValue}
                      onChange={(e) => handleColorPickerChange(e.target.value)}
                      className="w-16 h-16 p-0 border-2 rounded-lg cursor-pointer"
                    />
                    <div
                      className="w-16 h-8 rounded border-2"
                      style={{ backgroundColor: colorValue }}
                    />
                  </div>
                  
                  {/* Color Input & Formats */}
                  <div className="flex-1 space-y-3">
                    <div>
                      <Label htmlFor="colorInput" className="text-xs text-muted-foreground">
                        Enter hex, rgb(), or hsl()
                      </Label>
                      <Input
                        id="colorInput"
                        value={colorInput}
                        onChange={(e) => handleColorInputChange(e.target.value)}
                        placeholder="#ff0000, rgb(255,0,0), hsl(0,100%,50%)"
                        className="font-mono text-sm"
                      />
                    </div>
                    
                    {/* Format Display */}
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="p-2 bg-muted rounded">
                        <span className="text-muted-foreground block">HEX</span>
                        <span className="font-mono font-medium">{colorValue}</span>
                      </div>
                      {rgb && (
                        <div className="p-2 bg-muted rounded">
                          <span className="text-muted-foreground block">RGB</span>
                          <span className="font-mono font-medium">
                            {rgb.r}, {rgb.g}, {rgb.b}
                          </span>
                        </div>
                      )}
                      {hsl && (
                        <div className="p-2 bg-muted rounded">
                          <span className="text-muted-foreground block">HSL</span>
                          <span className="font-mono font-medium">
                            {hsl.h}°, {hsl.s}%, {hsl.l}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {editingColor ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
