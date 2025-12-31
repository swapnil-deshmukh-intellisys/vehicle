from PIL import Image, ImageDraw, ImageFont
import os

# Create a new white image
img = Image.new('RGB', (400, 200), color='white')
draw = ImageDraw.Draw(img)

# Draw car body
draw.rectangle([(100, 80), (300, 120)], outline='black', width=2)

# Draw car top
draw.rectangle([(140, 50), (260, 80)], outline='black', width=2)

# Draw wheels
draw.ellipse([(110, 100), (150, 140)], outline='black', width=2)
draw.ellipse([(250, 100), (290, 140)], outline='black', width=2)

# Draw windows
draw.line([(160, 50), (160, 80)], fill='black', width=1)
draw.line([(200, 50), (200, 80)], fill='black', width=1)
draw.line([(240, 50), (240, 80)], fill='black', width=1)

# Draw headlights and taillights
draw.rectangle([(100, 85), (110, 95)], outline='black', width=1)
draw.rectangle([(290, 85), (300, 95)], outline='black', width=1)

# Add text labels
draw.text((200, 25), "Front View", fill='black', anchor='mm')
draw.text((100, 170), "Left", fill='black', anchor='mm')
draw.text((300, 170), "Right", fill='black', anchor='mm')

# Save the image
img.save('/home/GMS/static/images/vehicle-diagram.png')
print("Vehicle diagram created successfully!")
