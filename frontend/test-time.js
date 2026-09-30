const d1 = "2026-09-30T10:30:00";
console.log(new Date(d1).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }));
console.log(new Date(d1 + "Z").toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }));
