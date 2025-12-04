#!/usr/bin/env python3
"""
Create placeholder frame images for Virtual Specs MVP
"""

import os
from PIL import Image, ImageDraw

def create_placeholder_frame(filename, width=300, height=100, color="black", style="classic"):
    """Create a simple placeholder frame image"""
    # Create transparent image
    img = Image.new('RGBA', (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    if style == "aviator":
        # Aviator style - teardrop shape
        draw.ellipse([width*0.1, height*0.2, width*0.4, height*0.8], outline=color, width=3)
        draw.ellipse([width*0.6, height*0.2, width*0.9, height*0.8], outline=color, width=3)
        draw.line([width*0.4, height*0.5, width*0.6, height*0.5], fill=color, width=3)

    elif style == "round":
        # Round style - circles
        draw.ellipse([width*0.1, height*0.1, width*0.4, height*0.9], outline=color, width=4)
        draw.ellipse([width*0.6, height*0.1, width*0.9, height*0.9], outline=color, width=4)
        draw.line([width*0.4, height*0.5, width*0.6, height*0.5], fill=color, width=3)

    elif style == "sport":
        # Sport style - rectangular
        draw.rectangle([width*0.1, height*0.3, width*0.4, height*0.7], outline=color, width=3)
        draw.rectangle([width*0.6, height*0.3, width*0.9, height*0.7], outline=color, width=3)
        draw.line([width*0.4, height*0.5, width*0.6, height*0.5], fill=color, width=3)

    return img

def main():
    frames_dir = "static/frames"
    os.makedirs(frames_dir, exist_ok=True)

    # Create aviator frame
    aviator = create_placeholder_frame(
        "aviator_classic.png",
        300, 100,
        color="#8B4513",
        style="aviator"
    )
    aviator.save(os.path.join(frames_dir, "aviator_classic.png"))
    print("Created aviator_classic.png")

    # Create round vintage frame
    vintage = create_placeholder_frame(
        "round_vintage.png",
        280, 120,
        color="#654321",
        style="round"
    )
    vintage.save(os.path.join(frames_dir, "round_vintage.png"))
    print("Created round_vintage.png")

    # Create sport modern frame
    sport = create_placeholder_frame(
        "sport_modern.png",
        320, 90,
        color="#000000",
        style="sport"
    )
    sport.save(os.path.join(frames_dir, "sport_modern.png"))
    print("Created sport_modern.png")

    print("Frame images created successfully!")

if __name__ == "__main__":
    main()