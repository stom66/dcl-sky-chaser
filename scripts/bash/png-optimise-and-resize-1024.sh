#!/bin/bash
#
# This script:
# - resizes PNGs to max 512px (using ImageMagick convert)
# - applies lossy compression (pngquant)
# - applies lossless optimisation (pngout)
# - prints a detailed summary table at the end
#

dir=${1:-.}
TMPFILE=$(mktemp)

# Loop through all PNG files (safe for spaces)
while IFS= read -r -d '' file; do
    echo "Optimising PNG: $file"

    # --- ORIGINAL SIZE ---
    original_size=$(stat -c%s "$file")

    # Preserve original
    mv "$file" "${file%.*}-src.png"

    # --- RESIZE FIRST (BEST QUALITY) ---
    convert "${file%.*}-src.png" \
        -filter Lanczos \
        -resize 1024x1024\> \
        -strip \
        PNG24:"$file"

    resized_size=$(stat -c%s "$file")

    # --- LOSSY COMPRESSION ---
    #pngquant --speed 2 \
    #         --quality 90-95 \
    #         --strip \
    #         --force \
    #         --output "$file" \
    #         "$file"

    lossy_size=$(stat -c%s "$file")

    # --- LOSSLESS COMPRESSION ---
    pngout "$file" >/dev/null 2>&1
    lossless_size=$(stat -c%s "$file")

    # Cleanup
    rm "${file%.*}-src.png"

    # --- REDUCTION CALCULATIONS ---
    resize_reduction=$(awk "BEGIN {printf \"%.2f\", (($original_size - $resized_size) / $original_size) * 100}")
    lossy_reduction=$(awk "BEGIN {printf \"%.2f\", (($resized_size - $lossy_size) / $resized_size) * 100}")
    lossless_reduction=$(awk "BEGIN {printf \"%.2f\", (($lossy_size - $lossless_size) / $lossy_size) * 100}")
    total_reduction=$(awk "BEGIN {printf \"%.2f\", (($original_size - $lossless_size) / $original_size) * 100}")

    # --- RECORD SUMMARY ROW ---
    printf "%-40s %10.2f %10.2f %10.2f %10.2f %8.2f%% %8.2f%% %8.2f%% %8.2f%%\n" \
        "$(basename "$file")" \
        "$(awk "BEGIN {print $original_size/1024}")" \
        "$(awk "BEGIN {print $resized_size/1024}")" \
        "$(awk "BEGIN {print $lossy_size/1024}")" \
        "$(awk "BEGIN {print $lossless_size/1024}")" \
        "$resize_reduction" \
        "$lossy_reduction" \
        "$lossless_reduction" \
        "$total_reduction" >> "$TMPFILE"

    echo "--------------------------------------------"
done < <(find "$dir" -type f -name "*.png" -print0)

# --- SUMMARY TABLE ---
echo
echo "==================== PNG OPTIMISATION SUMMARY ===================="
printf "%-40s %10s %10s %10s %10s %8s %8s %8s %8s\n" \
    "File" "Orig" "Resized" "Lossy" "Final" "Resize%" "Lossy%" "LL%" "Total%"
printf "%-40s %10s %10s %10s %10s %8s %8s %8s %8s\n" \
    "----------------------------------------" "--------" "--------" "--------" "--------" "------" "------" "------" "------"
cat "$TMPFILE"
echo "==================================================================="
echo

cowsay "All PNG files resized & opti-moos-ed 🐮"

rm "$TMPFILE"
