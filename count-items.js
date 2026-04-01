// Count items from the user's list
const itemsList = `Black Casual Shoes
Sg Kottayam
mmm
Messi l
testing1 - 9/black/slim
testing1 - 1/red/loose
testing1 - 2/black/slim
testing1 - 2/black/loose
testing1 - 2/red/slim
testing1 - 2/red/loose
kurtha
abhiram Vaazha
yyyyyyyy
yuuiio - 8
uqwhuiwhdukwhbdk
yyyyyyy - 9
hfuiheUDh
yugjh - 10
htrsrydh
Abhiram - 9
Lakshmi
leks - 9
Abhi
saad - blue
afsar
Abhiram - blue
Sanu
Lakshmi - Blue/9
Lakshmi - Blue/10
Lakshmi - black/9
Lakshmi - black/10
Sanu Sujanan
Black Shirts - blue
Design Shirtt
ronaldo - blue
ronaldo - blsack
ronaldo
Black Suits - grey/9
Black Suits - violet/8
Black Suits - black/10
Black Suits - black/12
Black Suits - gray/14
Black Suits - blue/8
Black Suits - blue/10
Black Suits - blue/12
Black Suits - red/9
Black Suits - red/8
Black Suits - red/10
Black Suits - red/12
Black Suits - green/9
Black Suits - green/8
Black Suits - green/10
Black Suits - green/12
black suit
Teests item
testing - red/60/1
testing - blue/9/2
testing - blue/6/1
testing - blue/6/2
testing - blue/8/1
testing - blue/8/2
testing - blue/7/1
testing - blue/7/2
testing - blue/36/1
testing - blue/36/2
testing - blue/28/1
testing - blue/28/2
testing - blue/32/1
testing - blue/32/2
testing - black/9/1
testing - black/9/2
testing - black/6/1
testing - black/6/2
testing - black/8/1
testing - black/8/2
testing - black/7/1
testing - black/7/2
testing - black/36/1
testing - black/36/2
testing - black/28/1
testing - black/28/2
testing - black/32/1
testing - black/32/2
testing - green/9/1
testing - green/9/2
testing - green/6/1
testing - green/6/2
testing - green/8/1
testing - green/8/2
testing - green/7/1
testing - green/7/2
testing - green/36/1
testing - green/36/2
testing - green/28/1
testing - green/28/2
testing - green/32/1
testing - green/32/2
testing - whote/9/1
testing - whote/9/2
testing - whote/6/1
testing - whote/6/2
testing - whote/8/1
testing - whote/8/2
testing - whote/7/1
testing - whote/7/2
testing - whote/36/1
testing - whote/36/2
testing - whote/28/1
testing - whote/28/2
testing - whote/32/1
testing - whote/32/2
kurtha
Black Suits - black/8
Shirts - black/10
Shirts - black/11
Shirts - black/12
Shirts - black/14
Shirts - black/15
Shirts - black/19
Shirts - black/34
Shirts - black/60
Shirts - black/88
Shirts - black/90
Shirts - black/100
Shirts - blue/10
Shirts - blue/11
Shirts - blue/12
Shirts - blue/14
Shirts - blue/15
Shirts - blue/19
Shirts - blue/34
Shirts - blue/60
Shirts - blue/88
Shirts - blue/90
Shirts - blue/100
Shirts - brown/10
Shirts - brown/11
Shirts - brown/12
Shirts - brown/14
Shirts - brown/15
Shirts - brown/19
Shirts - brown/34
Shirts - brown/60
Shirts - brown/88
Shirts - brown/90
Shirts - brown/100
Shirts - green/10
Shirts - green/11
Shirts - green/12
Shirts - green/14
Shirts - green/15
Shirts - green/19
Shirts - green/34
Shirts - green/60
Shirts - green/88
Shirts - green/90
Shirts - green/100
Shirts - greish/10
Shirts - greish/11
Shirts - greish/12
Shirts - greish/14
Shirts - greish/15
Shirts - greish/19
Shirts - greish/34
Shirts - greish/60
Shirts - greish/88
Shirts - greish/90
Shirts - greish/100
Shirts - White/10
Shirts - White/11
Shirts - White/12
Shirts - White/14
Shirts - White/15
Shirts - White/19
Shirts - White/34
Shirts - White/60
Shirts - White/88
Shirts - White/90
Shirts - White/100
Shirts - yellow/10
Shirts - yellow/11
Shirts - yellow/12
Shirts - yellow/14
Shirts - yellow/15
Shirts - yellow/19
Shirts - yellow/34
Shirts - yellow/60
Shirts - yellow/88
Shirts - yellow/90
Shirts - yellow/100
Shirts - maroon/10
Shirts - maroon/11
Shirts - maroon/12
Shirts - maroon/14
Shirts - maroon/15
Shirts - maroon/19
Shirts - maroon/34
Shirts - maroon/60
Shirts - maroon/88
Shirts - maroon/90
Shirts - red/100
test - blue/11
test - blue/11
test - black/9
test - black/10
Black shoes /9
Black shoes
Test
test
test - blue
Black shoes
designer dey - blue/8
designer dey - blue/9
designer dey - black/8
designer dey - black/9
designer dey - pink/8
designer dey - pink/9
designer dey - whit/8
designer dey - whit/9
Black shoes/9
White shoe/8
reees
test - blue
test-blue
lehnga
Lehanga - Green
Black Shoe -10
Design Shoes
BLAK
Black Lofer - 8/white
Black Lofer - 8/black
Black Lofer - 9/white
Black Lofer - 9/black
Black Lofer - 10/white
Black Lofer - 10/black
White shoe
Design Shoe - 9/White
Design Shoe - 9/White
Design Shoe - 9/black
Design Shoe - 9/blue
Design Shoe - 8/White
Design Shoe - 8/black
Design Shoe - 8/blue
Design Shoe - 7/White
Design Shoe - 7/black
Design Shoe - 7/blue
Design Shoe - 6/White
Design Shoe - 6/black
Design Shoe - 6/blue
Design Shoe - 10/White
Design Shoe - 10/black
Design Shoe - 10/blue`;

const items = itemsList.split('\n').filter(line => line.trim() !== '');
console.log(`Total items in the list: ${items.length}`);
console.log(`\nExpected: 256 items`);
console.log(`Actual: ${items.length} items`);
console.log(`Difference: ${256 - items.length} items`);

if (items.length < 256) {
  console.log(`\n❌ Missing ${256 - items.length} items!`);
  console.log(`This means the dropdown is NOT showing all items.`);
} else if (items.length === 256) {
  console.log(`\n✅ All 256 items are showing!`);
} else {
  console.log(`\n⚠️ Showing MORE than expected (${items.length} > 256)`);
}

console.log(`\n📊 Analysis:`);
console.log(`- The console logs show: 256 items available`);
console.log(`- The dropdown is showing: ${items.length} items`);
console.log(`- Load More button should show: "Load More (20 of 256)"`);
