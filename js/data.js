/* Static reference data: popular makes, service presets, warning lights, OBD-II codes */
var CC = window.CC = window.CC || {};

CC.POPULAR_MAKES = ["Acura","Alfa Romeo","Aston Martin","Audi","Bentley","BMW","Buick","Cadillac","Chevrolet","Chrysler","Dodge","Ferrari","Fiat","Ford","Genesis","GMC","Honda","Hyundai","Infiniti","Jaguar","Jeep","Kia","Lamborghini","Land Rover","Lexus","Lincoln","Lotus","Maserati","Mazda","McLaren","Mercedes-Benz","Mercury","Mini","Mitsubishi","Nissan","Oldsmobile","Polestar","Pontiac","Porsche","Ram","Rivian","Rolls-Royce","Saab","Saturn","Scion","Subaru","Suzuki","Tesla","Toyota","Volkswagen","Volvo"];

/* Service presets: [key, label, intervalMiles (0 = none), intervalMonths (0 = none)] */
CC.SERVICE_TYPES = [
  ["oil","Oil & filter change",5000,6],
  ["rotation","Tire rotation",6000,6],
  ["brakes","Brake pads / rotors",30000,0],
  ["brakefluid","Brake fluid flush",0,24],
  ["airfilter","Engine air filter",15000,12],
  ["cabinfilter","Cabin air filter",15000,12],
  ["coolant","Coolant flush",60000,48],
  ["trans","Transmission fluid",60000,60],
  ["plugs","Spark plugs",60000,72],
  ["battery","Battery replacement",0,48],
  ["wipers","Wiper blades",0,12],
  ["tires","New tires",50000,72],
  ["alignment","Wheel alignment",0,12],
  ["serpentine","Serpentine / drive belt",75000,72],
  ["timing","Timing belt / chain",90000,84],
  ["fuelfilter","Fuel filter",30000,36],
  ["diffluid","Differential / transfer case fluid",50000,0],
  ["powersteer","Power steering fluid",0,36],
  ["inspection","State inspection / emissions",0,12],
  ["registration","Registration / insurance",0,12],
  ["repair","Repair (other)",0,0],
  ["detail","Wash / detail",0,0],
  ["custom","Custom…",0,0]
];

/* Warning lights: [icon, name, color, urgency(ok|soon|stop), meaning, action] */
CC.LIGHTS = [
  ["🔴","Oil pressure warning","red","stop","Engine oil pressure is too low. Running the engine without oil pressure can destroy it within minutes.","Pull over safely and shut the engine off. Check the oil level. If low, add oil; if the light stays on after topping up, do not drive – tow it."],
  ["🌡️","Engine coolant temperature","red","stop","Engine is overheating or coolant level is dangerously low.","Pull over, turn the engine off, let it cool 30+ minutes. Never open the radiator cap hot. Check coolant level after cooling. Tow if it keeps overheating."],
  ["🔋","Battery / charging system","red","soon","The charging system isn't charging the battery – bad alternator, broken belt, or corroded/loose battery cable.","Turn off accessories and drive straight to a shop or parts store for a free charging test. You may only have 15–30 minutes of battery."],
  ["🛑","Brake system warning (BRAKE / !)","red","stop","Parking brake is on, brake fluid is low, or there's a hydraulic brake problem.","Check that the parking brake is fully released. If the light stays on, test brakes gently and check fluid level. If the pedal is soft or sinks, stop driving and call a tow."],
  ["⚙️","Check Engine (steady)","amber","soon","The engine computer detected an emissions or engine management fault.","Tighten the gas cap and drive normally for a few days. If it stays on, read the code (OBD-II scanner / free at most parts stores) and look it up in the Codes tab."],
  ["⚙️","Check Engine (flashing)","red","stop","Active engine misfire that can quickly overheat and destroy the catalytic converter.","Reduce speed/load immediately and get to a safe place. Avoid driving; if you must, go gently directly to a shop. Do not tow heavy loads."],
  ["(!)","Tire Pressure (TPMS)","amber","soon","One or more tires are 25% or more below the recommended pressure, or the TPMS system has a fault (if it blinks then stays solid).","Check all four tires (and spare) with a gauge and inflate to the door-jamb placard pressure. Look for nails. The light resets after driving a few miles."],
  ["ABS","Anti-lock Brake System (ABS)","amber","soon","ABS is disabled. Normal brakes still work, but wheels can lock in a panic stop.","Drive carefully, leave extra stopping distance, and get it checked (often a wheel-speed sensor)."],
  ["🚘","Traction / Stability control (flashing)","amber","ok","Flashing: the system is actively working to keep traction (slippery road). Solid: system has a fault or is switched off.","Flashing – ease off the throttle. Solid with no 'OFF' switched – have it scanned; often a steering angle or wheel-speed sensor."],
  ["🛞","Power steering (EPS) warning","red","soon","Electric power steering has a fault – steering will be much heavier.","Slow down and pull over if safe. Try restarting. If it persists, get it checked promptly; steering is still possible but very hard at low speed."],
  ["💨","Airbag / SRS","red","soon","The airbag system has a fault; airbags may not deploy in a crash.","Get diagnosed soon. Common causes: seat sensor, clock spring, or a loose connector under a seat."],
  ["🌫️","Diesel particulate filter (DPF)","amber","soon","The soot filter is getting full and needs a regeneration drive (sustained highway speed).","Drive 20+ minutes at highway speed. If the light remains or turns red / power is reduced, see a diesel shop."],
  ["⛽","Low fuel","amber","ok","You have roughly 30–60 miles (50–100 km) of fuel left, depending on the car.","Refuel soon. Running very low can damage the fuel pump and leave you stranded."],
  ["🪟","Door / trunk / hood ajar","amber","ok","A door, hatch, or hood isn't fully latched (or a sensor is dirty).","Stop and close it properly. If all are closed, clean/lubricate latch sensors."],
  ["🧯","Low washer fluid","amber","ok","Windshield washer reservoir is low.","Refill with proper washer fluid (not plain water in freezing weather)."],
  ["🛢️","Oil level / oil change reminder","amber","ok","Either oil level is low (if the car has an oil level sensor) or a maintenance interval has been reached.","Check the dipstick. Top up if low. If it's a reminder, schedule service and reset the reminder afterwards."],
  ["🔧","Maintenance required / wrench","amber","ok","A scheduled service reminder, or a drivetrain/throttle fault on some cars (a wrench with a red color or reduced power is more serious).","Check the owner's manual. If power is reduced, have the vehicle scanned soon."],
  ["🚫","Brake pad wear","amber","soon","Brake pad wear sensor indicates pads are near the end of life.","Book brake service within the next few hundred miles to avoid damaging rotors."],
  ["❄️","Low temp / ice warning","blue","ok","Outside temperature near freezing – road may be icy.","Drive slower, brake early. Bridges ice first."],
  ["🧊","Cold engine temperature (blue)","blue","ok","The engine hasn't reached normal operating temperature yet.","Drive gently until it goes out. If it never goes out after 10–15 minutes, the thermostat may be stuck open."],
  ["💡","High beam indicator","blue","ok","High beams are on.","Switch to low beams for oncoming traffic."],
  ["🟢","Cruise control active","green","ok","Cruise control is set and active.","Nothing to do."],
  ["🔑","Immobilizer / security key light","amber","soon","The anti-theft system isn't recognising the key (flashing is normal when the car is parked and locked).","Try the spare key; keep the key away from other keys/fobs. If the car won't start, see a locksmith or dealer."],
  ["⚡","Hybrid / EV system warning","amber","soon","Fault in the hybrid or high-voltage battery/charging system. Red = stop.","Do not open any orange HV cables. Have the vehicle checked by a hybrid/EV-qualified technician."],
  ["🌬️","Low coolant level","amber","soon","Coolant in the reservoir is low.","Check level when cold and top up with the correct coolant type. Look for leaks if it keeps dropping."],
  ["🛣️","Lane departure / driver assist fault","amber","ok","A camera or radar sensor is blocked or has a fault.","Clean the windshield around the camera and the bumper radar area; wipe off ice, mud or snow. Get a scan if it persists."],
  ["🏎️","Transmission temperature","red","stop","Transmission fluid is overheating.","Pull over and let it idle in Park/Neutral for a few minutes, then drive gently. Avoid towing. Check fluid level."],
  ["🔥","Exhaust / emissions fluid (DEF) low","amber","soon","Diesel exhaust fluid is low – many vehicles limit speed or refuse to restart once it runs out.","Fill the DEF tank (blue cap) with proper AdBlue/DEF fluid."],
  ["🔧","Reduced engine power (turtle / lightning)","amber","soon","The computer has limited power to protect the engine, usually due to throttle or sensor faults.","Drive gently to a safe place, restart once, and have it scanned."]
];

/* OBD-II codes: CODE|Description|Common causes|urgency (o=ok to drive, s=soon, x=stop/avoid) */
CC.OBD_RAW = `
P0010|"A" Camshaft Position Actuator Circuit (Bank 1)|Dirty/low oil, bad VVT solenoid, wiring|s
P0011|"A" Camshaft Timing Over-Advanced (Bank 1)|Low/dirty oil, VVT solenoid, stretched timing chain|s
P0012|"A" Camshaft Timing Over-Retarded (Bank 1)|Low/dirty oil, VVT solenoid, timing chain|s
P0016|Crankshaft/Camshaft Position Correlation (Bank 1 Sensor A)|Stretched timing chain/belt, bad sensors|x
P0030|HO2S Heater Control Circuit (Bank 1 Sensor 1)|Failed O2 sensor heater, wiring, fuse|o
P0036|HO2S Heater Control Circuit (Bank 1 Sensor 2)|Failed downstream O2 sensor heater, wiring|o
P0087|Fuel Rail/System Pressure Too Low|Weak fuel pump, clogged filter, regulator|x
P0088|Fuel Rail/System Pressure Too High|Faulty regulator or pressure sensor|s
P0100|Mass Air Flow (MAF) Circuit Malfunction|Dirty/failed MAF sensor, intake leak, wiring|s
P0101|Mass Air Flow Circuit Range/Performance|Dirty MAF, air leak after MAF, dirty air filter|s
P0102|Mass Air Flow Circuit Low Input|MAF sensor failure, wiring, vacuum leak|s
P0103|Mass Air Flow Circuit High Input|MAF sensor failure, wiring|s
P0105|Manifold Absolute Pressure (MAP) Circuit Malfunction|MAP sensor, vacuum hose, wiring|s
P0106|MAP Circuit Range/Performance|MAP sensor, vacuum leak, exhaust restriction|s
P0107|MAP Circuit Low Input|MAP sensor or wiring short|s
P0108|MAP Circuit High Input|MAP sensor, vacuum line|s
P0110|Intake Air Temperature Circuit Malfunction|IAT sensor, wiring|o
P0112|Intake Air Temperature Circuit Low|IAT sensor shorted|o
P0113|Intake Air Temperature Circuit High|IAT sensor open, wiring|o
P0115|Engine Coolant Temperature Circuit Malfunction|ECT sensor, wiring|s
P0116|Engine Coolant Temp Circuit Range/Performance|Thermostat stuck, ECT sensor|s
P0117|Engine Coolant Temp Circuit Low|ECT sensor shorted|s
P0118|Engine Coolant Temp Circuit High|ECT sensor open, wiring|s
P0120|Throttle/Pedal Position Sensor A Circuit Malfunction|Throttle position sensor, dirty throttle body|s
P0121|Throttle Position Sensor Range/Performance|Dirty throttle body, TPS failure|s
P0122|Throttle Position Sensor Circuit Low|TPS, wiring|s
P0123|Throttle Position Sensor Circuit High|TPS, wiring|s
P0125|Insufficient Coolant Temp for Closed Loop|Thermostat stuck open, low coolant, ECT sensor|o
P0128|Coolant Thermostat Below Regulating Temperature|Thermostat stuck open (very common)|o
P0130|O2 Sensor Circuit Malfunction (Bank 1 Sensor 1)|Failed O2 sensor, exhaust leak, wiring|o
P0131|O2 Sensor Circuit Low Voltage (B1S1)|O2 sensor, exhaust leak, lean condition|o
P0132|O2 Sensor Circuit High Voltage (B1S1)|O2 sensor, rich condition|o
P0133|O2 Sensor Slow Response (B1S1)|Aging O2 sensor|o
P0134|O2 Sensor No Activity Detected (B1S1)|Dead O2 sensor, wiring|o
P0135|O2 Sensor Heater Circuit Malfunction (B1S1)|O2 sensor heater, fuse|o
P0137|O2 Sensor Circuit Low Voltage (B1S2)|Downstream O2 sensor, exhaust leak|o
P0138|O2 Sensor Circuit High Voltage (B1S2)|Downstream O2 sensor, rich condition|o
P0141|O2 Sensor Heater Circuit Malfunction (B1S2)|Downstream O2 sensor heater|o
P0150|O2 Sensor Circuit Malfunction (Bank 2 Sensor 1)|Failed O2 sensor, wiring|o
P0153|O2 Sensor Slow Response (Bank 2 Sensor 1)|Aging O2 sensor|o
P0155|O2 Sensor Heater Circuit Malfunction (B2S1)|O2 sensor heater, fuse|o
P0161|O2 Sensor Heater Circuit Malfunction (B2S2)|Downstream O2 sensor heater|o
P0171|System Too Lean (Bank 1)|Vacuum leak, dirty MAF, weak fuel pump, clogged injectors|s
P0172|System Too Rich (Bank 1)|Leaking injector, bad MAF, fuel pressure regulator|s
P0174|System Too Lean (Bank 2)|Vacuum leak, dirty MAF, fuel delivery|s
P0175|System Too Rich (Bank 2)|Leaking injector, bad MAF, regulator|s
P0190|Fuel Rail Pressure Sensor Circuit Malfunction|Sensor or wiring|s
P0191|Fuel Rail Pressure Sensor Range/Performance|Sensor, weak pump, clogged filter|s
P0200|Injector Circuit Malfunction|Injector wiring, bad injector, PCM driver|s
P0201|Injector Circuit Malfunction – Cylinder 1|Injector or connector (cyl 1)|s
P0202|Injector Circuit Malfunction – Cylinder 2|Injector or connector (cyl 2)|s
P0203|Injector Circuit Malfunction – Cylinder 3|Injector or connector (cyl 3)|s
P0204|Injector Circuit Malfunction – Cylinder 4|Injector or connector (cyl 4)|s
P0217|Engine Coolant Over Temperature Condition|Overheating: low coolant, fan, thermostat, water pump|x
P0218|Transmission Over Temperature Condition|Low/old trans fluid, towing, cooler restriction|x
P0219|Engine Overspeed Condition|Missed shift, downhill coasting, transmission|s
P0220|Throttle/Pedal Position Sensor B Circuit Malfunction|Throttle body, pedal sensor|s
P0221|Throttle/Pedal Position Sensor B Range/Performance|Throttle body, pedal sensor|s
P0222|Throttle Position Sensor B Circuit Low|Sensor/wiring|s
P0223|Throttle Position Sensor B Circuit High|Sensor/wiring|s
P0230|Fuel Pump Primary Circuit Malfunction|Fuel pump relay, fuse, pump|x
P0234|Turbo/Supercharger Overboost Condition|Wastegate stuck, boost leak/actuator, MAP sensor|s
P0235|Turbo Boost Sensor A Circuit Malfunction|Boost sensor, wiring|s
P0236|Turbo Boost Sensor A Range/Performance|Boost leak, sensor|s
P0299|Turbo/Supercharger Underboost|Boost leak, wastegate, hose, turbocharger|s
P0300|Random/Multiple Cylinder Misfire Detected|Plugs, coils, vacuum leaks, low fuel pressure|s
P0301|Cylinder 1 Misfire Detected|Spark plug, ignition coil, injector, compression|s
P0302|Cylinder 2 Misfire Detected|Spark plug, ignition coil, injector, compression|s
P0303|Cylinder 3 Misfire Detected|Spark plug, ignition coil, injector, compression|s
P0304|Cylinder 4 Misfire Detected|Spark plug, ignition coil, injector, compression|s
P0305|Cylinder 5 Misfire Detected|Spark plug, ignition coil, injector, compression|s
P0306|Cylinder 6 Misfire Detected|Spark plug, ignition coil, injector, compression|s
P0307|Cylinder 7 Misfire Detected|Spark plug, ignition coil, injector, compression|s
P0308|Cylinder 8 Misfire Detected|Spark plug, ignition coil, injector, compression|s
P0315|Crankshaft Position System Variation Not Learned|After battery/PCM work – relearn needed|o
P0320|Ignition/Distributor Engine Speed Input Circuit|Crank sensor wiring/sensor|s
P0325|Knock Sensor 1 Circuit Malfunction (Bank 1)|Knock sensor, wiring|s
P0327|Knock Sensor 1 Circuit Low (Bank 1)|Knock sensor/wiring|s
P0335|Crankshaft Position Sensor A Circuit Malfunction|Crank sensor, wiring (often stalls/no-start)|x
P0336|Crankshaft Position Sensor A Range/Performance|Crank sensor, reluctor ring|x
P0340|Camshaft Position Sensor A Circuit Malfunction (Bank 1)|Cam sensor, wiring|s
P0341|Camshaft Position Sensor A Range/Performance|Cam sensor, timing chain stretch|s
P0351|Ignition Coil A Primary/Secondary Circuit|Ignition coil #1, wiring|s
P0352|Ignition Coil B Primary/Secondary Circuit|Ignition coil #2, wiring|s
P0353|Ignition Coil C Primary/Secondary Circuit|Ignition coil #3, wiring|s
P0354|Ignition Coil D Primary/Secondary Circuit|Ignition coil #4, wiring|s
P0400|Exhaust Gas Recirculation (EGR) Flow Malfunction|Clogged EGR valve/passages|o
P0401|EGR Flow Insufficient Detected|Clogged EGR, carbon, DPFE sensor|o
P0402|EGR Flow Excessive Detected|Stuck-open EGR valve|s
P0403|EGR Circuit Malfunction|EGR solenoid/wiring|o
P0404|EGR Circuit Range/Performance|EGR valve stuck|o
P0420|Catalyst System Efficiency Below Threshold (Bank 1)|Worn catalytic converter, O2 sensors, exhaust leak|s
P0421|Warm Up Catalyst Efficiency Below Threshold (Bank 1)|Catalytic converter|s
P0430|Catalyst System Efficiency Below Threshold (Bank 2)|Worn catalytic converter, O2 sensors|s
P0440|Evaporative Emission (EVAP) System Malfunction|Gas cap, EVAP hoses, purge valve|o
P0441|EVAP Incorrect Purge Flow|Purge valve, hoses|o
P0442|EVAP System Leak Detected (Small Leak)|Loose/bad gas cap, cracked hose|o
P0443|EVAP Purge Control Valve Circuit|Purge valve, wiring|o
P0446|EVAP Vent Control Circuit Malfunction|Vent valve, blocked vent line|o
P0449|EVAP Vent Valve/Solenoid Circuit|Vent valve|o
P0450|EVAP Pressure Sensor Malfunction|Pressure sensor, wiring|o
P0451|EVAP Pressure Sensor Range/Performance|Sensor, blocked vent|o
P0455|EVAP System Leak Detected (Large Leak)|Gas cap missing/loose, disconnected hose|o
P0456|EVAP System Leak Detected (Very Small Leak)|Gas cap seal, hose, purge valve|o
P0457|EVAP Leak Detected (Fuel Cap Loose/Off)|Gas cap not tightened|o
P0460|Fuel Level Sensor Circuit Malfunction|Fuel level sender, wiring|o
P0480|Cooling Fan 1 Control Circuit Malfunction|Fan relay, fan motor, wiring|s
P0481|Cooling Fan 2 Control Circuit Malfunction|Fan relay, fan motor|s
P0500|Vehicle Speed Sensor Malfunction|VSS/wheel-speed sensor, wiring|s
P0501|Vehicle Speed Sensor Range/Performance|VSS, tire size mismatch|s
P0505|Idle Control System Malfunction|Dirty throttle body, IAC valve, vacuum leak|s
P0506|Idle Control RPM Lower Than Expected|Dirty throttle body, vacuum leak|o
P0507|Idle Control RPM Higher Than Expected|Vacuum leak, dirty throttle body|o
P0520|Engine Oil Pressure Sensor/Switch Circuit|Oil pressure sensor, wiring – verify real oil pressure|s
P0521|Engine Oil Pressure Sensor Range/Performance|Low oil, sensor|x
P0522|Engine Oil Pressure Sensor Low Voltage|Sensor, real low oil pressure|x
P0562|System Voltage Low|Weak battery/alternator, bad grounds|s
P0563|System Voltage High|Overcharging alternator/regulator|s
P0571|Brake Switch A Circuit Malfunction|Brake light switch|s
P0600|Serial Communication Link Malfunction|Module communication fault|s
P0601|Internal Control Module Memory Check Sum Error|PCM fault|s
P0606|Control Module Processor Fault|PCM fault|s
P0620|Generator Control Circuit Malfunction|Alternator, wiring|s
P0627|Fuel Pump "A" Control Circuit/Open|Pump relay, fuel pump driver|x
P0630|VIN Not Programmed or Mismatch – ECM/PCM|PCM replaced/not programmed|o
P0641|Sensor Reference Voltage "A" Circuit/Open|Shorted sensor, wiring|s
P0657|Actuator Supply Voltage "A" Circuit/Open|PCM, wiring|s
P0700|Transmission Control System Malfunction|TCM has stored a code – scan transmission module|s
P0701|Transmission Control System Range/Performance|Low fluid, solenoid, TCM|s
P0705|Transmission Range Sensor Circuit (PRNDL Input)|Range switch/neutral safety switch|s
P0706|Transmission Range Sensor Range/Performance|Range sensor misadjusted|s
P0710|Transmission Fluid Temperature Sensor Circuit|Temp sensor, wiring, fluid|s
P0715|Input/Turbine Speed Sensor Circuit Malfunction|Speed sensor, wiring|s
P0720|Output Speed Sensor Circuit Malfunction|Output speed sensor|s
P0730|Incorrect Gear Ratio|Slipping clutches, low fluid, solenoids|x
P0731|Gear 1 Incorrect Ratio|Internal wear, low fluid|x
P0732|Gear 2 Incorrect Ratio|Internal wear, low fluid|x
P0740|Torque Converter Clutch Circuit Malfunction|TCC solenoid, fluid|s
P0741|Torque Converter Clutch Circuit Performance/Stuck Off|TCC solenoid, fluid, converter|s
P0742|Torque Converter Clutch Circuit Stuck On|TCC solenoid/valve|s
P0743|Torque Converter Clutch Circuit Electrical|Solenoid, wiring|s
P0750|Shift Solenoid A Malfunction|Solenoid, fluid|s
P0755|Shift Solenoid B Malfunction|Solenoid, fluid|s
P0760|Shift Solenoid C Malfunction|Solenoid, fluid|s
P0765|Shift Solenoid D Malfunction|Solenoid, fluid|s
P0771|Shift Solenoid E Performance|Solenoid, valve body|s
P0780|Shift Malfunction|Fluid, solenoids, mechanical|s
P0781|1-2 Shift Malfunction|Solenoid, worn clutches|s
P0782|2-3 Shift Malfunction|Solenoid, worn clutches|s
P0783|3-4 Shift Malfunction|Solenoid, worn clutches|s
P0795|Pressure Control Solenoid C Malfunction|Solenoid, valve body|s
P0841|Transmission Fluid Pressure Sensor/Switch A Range|Sensor, fluid|s
P0870|Transmission Fluid Pressure Sensor/Switch C Circuit|Sensor, wiring|s
P0A80|Replace Hybrid Battery Pack|Weak hybrid battery cells|s
P0A0F|Engine Failed to Start (Hybrid)|Engine start system / hybrid control|s
P0AA6|Hybrid Battery Voltage System Isolation Fault|HV leakage – professional service required|x
P1000|OBD-II Monitor Testing Not Complete|Recent battery disconnect / code clear – drive cycles|o
P1101|MAF Sensor Out of Self-Test Range (Ford)|Dirty MAF, intake leak|s
P1131|Lack of HO2S Switch – Sensor Indicates Lean (Ford)|O2 sensor, vacuum leak|s
P1133|HO2S Insufficient Switching (Ford/Toyota)|O2 sensor aging, fuel trims|o
P1456|EVAP Emission Control System Leak (Ford)|Fuel cap, hoses|o
P1450|Unable to Bleed Up Fuel Tank Vacuum (Ford)|Blocked vent line/valve|o
P1500|Vehicle Speed Sensor Circuit (Ford/Chrysler)|VSS, wiring|s
P2006|Intake Manifold Runner Control Stuck Closed (Bank 1)|Intake runner actuator|s
P2096|Post Catalyst Fuel Trim System Too Lean (Bank 1)|Exhaust leak, O2 sensor, fuel delivery|s
P2097|Post Catalyst Fuel Trim System Too Rich (Bank 1)|Rich condition, O2 sensor|s
P2101|Throttle Actuator Control Motor Circuit Range/Performance|Throttle body|s
P2106|Throttle Actuator Control System – Forced Limited Power|Throttle body, wiring|s
P2110|Throttle Actuator Control System – Forced Limited RPM|Throttle body|s
P2119|Throttle Actuator Control Throttle Body Range/Performance|Throttle body|s
P2135|Throttle/Pedal Position Sensor A/B Voltage Correlation|Throttle body, pedal sensor|s
P2138|Throttle/Pedal Position Sensor D/E Voltage Correlation|Accelerator pedal sensor|s
P2187|System Too Lean at Idle (Bank 1)|Vacuum leak, intake leak, fuel pressure|s
P2188|System Too Rich at Idle (Bank 1)|Leaking injectors, MAF|s
P2195|O2 Sensor Signal Stuck Lean (B1S1)|O2 sensor, exhaust leak|o
P2196|O2 Sensor Signal Stuck Rich (B1S1)|O2 sensor, fuel pressure|o
P2270|O2 Sensor Signal Stuck Lean (B1S2)|Downstream O2 sensor|o
P2271|O2 Sensor Signal Stuck Rich (B1S2)|Downstream O2 sensor|o
P2279|Intake Air System Leak|Air leak between MAF and engine|s
P2293|Fuel Pressure Regulator 2 Performance|Regulator, pump|s
P2294|Fuel Pressure Regulator 2 Control Circuit|Regulator, wiring|s
P2300|Ignition Coil A Primary Control Circuit Low|Coil #1, wiring|s
P2303|Ignition Coil C Primary Control Circuit Low|Coil #3, wiring|s
P2096|Post Catalyst Fuel Trim System Too Lean (Bank 1)|Exhaust leak, O2 sensor|s
P2400|EVAP Leak Detection Pump Control Circuit|Leak detection pump|o
P2401|EVAP Leak Detection Pump Control Circuit Low|Pump/wiring|o
P2404|EVAP Leak Detection Pump Sense Circuit Range|Pump/ canister|o
P2414|O2 Sensor Exhaust Sample Error (Bank 1 Sensor 1)|O2 sensor|o
P2423|HC Adsorption Catalyst Efficiency Below Threshold|Catalyst|s
P2430|Secondary Air Injection System Air Flow (Bank 1)|Air pump, hoses|o
P2431|Secondary Air Injection System Air Flow Range|Air pump, valve|o
P2440|Secondary Air Injection Switching Valve Stuck Open (Bank 1)|Valve|o
P2442|Secondary Air Injection Switching Valve Stuck Open (Bank 2)|Valve|o
P2610|ECM/PCM Internal Engine Off Timer Performance|PCM|o
P2646|Rocker Arm Actuator "A" System Performance (Bank 1)|Honda VTEC/oil level/pressure|s
P2A00|O2 Sensor Circuit Range/Performance (Bank 1 Sensor 1)|O2 sensor|o
B0001|Driver Frontal Stage 1 Deployment Control (Airbag)|Airbag circuit – professional service|s
B1000|Chassis/Body ECU fault (manufacturer-specific)|Module|s
C0035|Left Front Wheel Speed Sensor Circuit|Wheel speed sensor, wiring, tone ring|s
C0040|Right Front Wheel Speed Sensor Circuit|Wheel speed sensor, wiring|s
C0045|Left Rear Wheel Speed Sensor Circuit|Wheel speed sensor, wiring|s
C0050|Right Rear Wheel Speed Sensor Circuit|Wheel speed sensor, wiring|s
C0110|Pump Motor Circuit (ABS)|ABS pump motor, relay|s
C0561|Stability/ABS Control Module Fault|Module/sensors|s
U0001|High Speed CAN Communication Bus|Wiring, module, bus short|s
U0100|Lost Communication with ECM/PCM "A"|PCM power/ground, wiring, battery|x
U0101|Lost Communication with TCM|Transmission control module, CAN bus|s
U0121|Lost Communication with ABS Control Module|ABS module, wiring|s
U0140|Lost Communication with Body Control Module|BCM, wiring, battery|s
U0155|Lost Communication with Instrument Panel Cluster|Cluster, CAN bus|s
U0164|Lost Communication with HVAC Control Module|HVAC module, CAN bus|o
U0401|Invalid Data Received from ECM/PCM "A"|PCM, CAN bus, wiring|s
`;

/* Explanations used for any code, even those not in the embedded list */
CC.OBD_SYSTEMS = {
  P:"Powertrain – engine, transmission, fuel, ignition and emissions",
  B:"Body – airbags, seats, climate control, lighting, power accessories",
  C:"Chassis – ABS, traction control, steering and suspension",
  U:"Network – communication between control modules (CAN bus)"
};
CC.OBD_DIGIT2 = {
  P:{0:"Generic (SAE standard) – same meaning on every make",1:"Manufacturer-specific – meaning depends on the brand",2:"Generic (SAE standard)",3:"Generic / manufacturer (hybrid & misc. – 3000–3399 manufacturer, 3400–3999 generic)"},
  B:{0:"Generic",1:"Manufacturer-specific",2:"Manufacturer-specific",3:"Generic"},
  C:{0:"Generic",1:"Manufacturer-specific",2:"Manufacturer-specific",3:"Generic"},
  U:{0:"Generic",1:"Manufacturer-specific",2:"Manufacturer-specific",3:"Generic"}
};
CC.OBD_P_RANGES = [
  ["P0000–P0099","Fuel and air metering / auxiliary emission controls (e.g. P0010–P0016 variable valve timing)"],
  ["P0100–P0199","Fuel and air metering: MAF, MAP, throttle, coolant & intake temperature, O2 sensors, fuel trim (P0171/P0174)"],
  ["P0200–P0299","Fuel and air metering – injector circuits, fuel pump, turbo/supercharger boost"],
  ["P0300–P0399","Ignition system and misfires: P0300 random misfire, P0301–P0312 cylinder-specific, crank/cam sensors, knock sensors, ignition coils"],
  ["P0400–P0499","Auxiliary emission controls: EGR, EVAP (P044x/P045x), catalyst (P042x/P043x), secondary air, cooling fans (P048x)"],
  ["P0500–P0599","Vehicle speed, idle control and auxiliary inputs: speed sensor, idle RPM, oil pressure, battery voltage, brake switch"],
  ["P0600–P0699","Computer and output circuits: PCM faults, serial communication, fuel pump control, reference voltage"],
  ["P0700–P0799","Transmission: range sensor, speed sensors, torque converter, shift solenoids, incorrect gear ratio"],
  ["P0800–P0899","Transmission – clutches, transfer case, pressure sensors"],
  ["P0900–P0999","Transmission – clutch actuators, solenoids, gear shift"],
  ["P0A00–P0AFF","Hybrid / EV drive system: battery, inverter, motor, high-voltage isolation"],
  ["P1000–P1999","Manufacturer-specific (look up your make: Ford, GM, Toyota, Honda, etc.)"],
  ["P2000–P2999","Generic – newer additions: DPF/diesel particulate (P2002), throttle actuator (P21xx), lean/rich at idle (P2187/8), EVAP (P24xx), secondary air (P24xx), NOx (P20xx)"],
  ["P3000–P3399","Manufacturer-specific (cylinder deactivation, hybrid, etc.)"],
  ["P3400–P3999","Generic – cylinder deactivation (P34xx)"]
];
CC.OBD_PARSED = (function(){
  const out={};
  CC.OBD_RAW.split("\n").forEach(l=>{
    const p=l.split("|"); if(p.length<4) return;
    out[p[0].trim()]={code:p[0].trim(),desc:p[1].trim(),causes:p[2].trim(),urg:p[3].trim()};
  });
  return out;
})();
