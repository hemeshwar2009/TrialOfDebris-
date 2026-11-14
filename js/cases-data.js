/**
 * NASA SPACE LEGACY - Complete 24 Unique Mission Case Files
 * 12 UNIQUE MISSIONS FOR MARS + 12 UNIQUE MISSIONS FOR MOONS = 24 TOTAL UNIQUE LEVELS
 * Zero repeated missions or concepts. Derived from verified NASA historical records.
 */

window.MISSION_DATABASE = {
  "mars": {
    "starter": [
      {
        "id": "mars_01_oppy",
        "level": 1,
        "missionNumber": 1,
        "globalLevel": 1,
        "tier": "starter",
        "destination": "mars",
        "codename": "MER-B (Opportunity)",
        "title": "Opportunity: The 14-Year Survivor & Dust Storm",
        "target": "Mars - Meridiani Planum to Endeavour Crater",
        "dateRange": "2003 - 2018",
        "mystery": "Why did a rover engineered for 90 days survive for 14 years, only to go silent during the 2018 global dust storm?",
        "endingType": "Lost in Planet-Encircling Dust Storm",
        "badge": "MER-OPPORTUNITY-CADET",
        "badgeIcon": "☀️",
        "hardwareDiagram": "rover_oppy",
        "interactiveComponents": [
          {
            "id": "solar_array",
            "name": "Triple-Junction Solar Panels",
            "status": "BLOCKED BY SILT",
            "statusType": "confirmed",
            "description": "Atmospheric opacity Tau exceeded 10.8, dropping energy from 645 Wh down to a fatal 22 Wh.",
            "silentStory": "The Martian sky darkened into pitch black. Without sun, survival heaters failed and electronics froze."
          },
          {
            "id": "thermal_heaters",
            "name": "Radioisotope Heater Units",
            "status": "FROZEN AT -55°C",
            "statusType": "suspected",
            "description": "Once battery power dropped below minimum threshold, internal components dropped into cryogenic chill.",
            "silentStory": "Opportunity had survived over 5,000 Martian sols, but could not survive the night without power."
          },
          {
            "id": "mott_antenna",
            "name": "High-Gain X-Band Dish",
            "status": "LAST BEACON: JUNE 10, 2018",
            "statusType": "confirmed",
            "description": "Over 1,000 recovery commands sent across 8 months received zero response from Goldstone DSN.",
            "silentStory": "NASA's final wake-up song beamed across deep space was Billie Holiday's 'I'll Be Seeing You'."
          }
        ],
        "clues": [
          {
            "title": "Sky Opacity Chart (Tau > 10.8)",
            "type": "confirmed",
            "text": "Dust in the Martian sky blocked 99% of sunlight, darkening the crater into near-total night."
          },
          {
            "title": "Solar Power Drop Log",
            "type": "confirmed",
            "text": "Solar power plunged from 645 Wh down to 22 Wh—far below what the battery needed to keep heaters alive."
          },
          {
            "title": "Unreachable Subsystems",
            "type": "suspected",
            "text": "Whether the battery cells froze solid or the master clock scrambled is unknown, as no data returned."
          }
        ],
        "miniGame": {
          "type": "sun_hunter",
          "instruction": "SOLAR HARVEST: Tilt Opportunity's solar panels toward sporadic sunbeams while clearing dust buildup to restore power to 100%!"
        },
        "hypotheses": [
          {
            "id": "h1",
            "text": "A planet-wide dust storm blocked sunlight, draining the batteries and freezing internal electronics.",
            "correct": true,
            "explanation": "CONFIRMED: The global dust storm choked out sunlight (Tau > 10.8), dropping power below heater survival thresholds (~22 Wh)."
          },
          {
            "id": "h2",
            "text": "The rover drove off an unseen cliff into Endeavour Crater during poor visibility.",
            "correct": false,
            "explanation": "INCORRECT: Telemetry confirms Opportunity was stationary in Perseverance Valley with wheels locked."
          }
        ],
        "historicalDebrief": {
          "whatInvestigatorsProved": "Confirmed that the June 2018 planet-wide dust storm starved the rover of solar power, exhausting batteries.",
          "whatRemainsSuspected": "Whether the battery cells experienced chemical freeze-out or the master clock desynchronized first.",
          "engineeringLegacy": "NASA switched to Nuclear Radioisotope Generators (RTGs) for Curiosity and Perseverance so storms cannot kill them.",
          "openQuestion": "Can autonomous electrostatic dust repellers protect future human solar installations on Mars?"
        }
      },
      {
        "id": "mars_02_mco",
        "level": 2,
        "missionNumber": 2,
        "globalLevel": 2,
        "tier": "starter",
        "destination": "mars",
        "codename": "MCO-98",
        "title": "Mars Climate Orbiter: The Units Mix-Up",
        "target": "Mars - High Atmospheric Insertion",
        "dateRange": "1998 - 1999",
        "mystery": "A $327-million robotic explorer traveled 9 months to Mars, then burned up at the finish line. What math error destroyed it?",
        "endingType": "Atmospheric Entry Burnup",
        "badge": "MCO-UNITS-CADET",
        "badgeIcon": "📐",
        "hardwareDiagram": "orbiter_mco",
        "interactiveComponents": [
          {
            "id": "nav_software",
            "name": "SM_FORCES Ground Software",
            "status": "ENGLISH LBF·S INSTEAD OF N·S",
            "statusType": "confirmed",
            "description": "Calculated thruster Small Forces in imperial pound-force seconds instead of metric newton-seconds (1 lbf·s = 4.45 N·s).",
            "silentStory": "The spacecraft received 4.45 times less velocity correction than navigation calculated during its entire cruise."
          },
          {
            "id": "main_engine",
            "name": "LEROS-1b 640N Main Engine",
            "status": "FIRED AT 57 KM ALTITUDE",
            "statusType": "confirmed",
            "description": "Designed for orbit insertion at 140–150 km. Fired at 57 km where atmospheric friction tore the solar panels off.",
            "silentStory": "Flight directors at JPL watched radio carrier lock vanish 49 seconds ahead of schedule, never to return."
          }
        ],
        "clues": [
          {
            "title": "English vs Metric File",
            "type": "confirmed",
            "text": "Software used pound-force seconds instead of required metric newton-seconds."
          },
          {
            "title": "57 km Danger Periapsis",
            "type": "confirmed",
            "text": "The spacecraft passed 85 kilometers too low into thick Martian atmosphere."
          },
          {
            "title": "Dynamic Aerodynamic Pressure",
            "type": "suspected",
            "text": "The single solar array yoke snapped under 0.2 bars of aerodynamic drag."
          }
        ],
        "miniGame": {
          "type": "unit_converter",
          "instruction": "NAVIGATION CORRECTION: Spot and convert mismatched imperial (lbf·s) values into SI metric (N·s) before the trajectory dips below the Martian entry boundary!"
        },
        "hypotheses": [
          {
            "id": "h1",
            "text": "Ground software calculated thruster impulses in imperial pound-force seconds while navigation expected metric newtons, plunging it 85 km too low into the fiery atmosphere.",
            "correct": true,
            "explanation": "CONFIRMED: The historic unit mismatch (lbf·s vs N·s) led to an undetected trajectory error that dropped periapsis to 57 km."
          },
          {
            "id": "h2",
            "text": "A micrometeorite struck the main hydrazine propellant line during final cruise, causing an explosion.",
            "correct": false,
            "explanation": "INCORRECT: Telemetry right up to occultation showed nominal propellant pressures and healthy systems."
          }
        ],
        "historicalDebrief": {
          "whatInvestigatorsProved": "Confirmed that ground software output thruster impulses in English units instead of metric units specified in contract ICDs.",
          "whatRemainsSuspected": "Whether pieces survived and skipped back into orbit around the Sun.",
          "engineeringLegacy": "Mandated strict universal SI Metric standards across all NASA contractors and created end-to-end mission verification milestones.",
          "openQuestion": "How can autonomous onboard spacecraft AI cross-check ground commands to detect human translation errors before execution?"
        }
      },
      {
        "id": "mars_03_mpl",
        "level": 3,
        "missionNumber": 3,
        "globalLevel": 3,
        "tier": "starter",
        "destination": "mars",
        "codename": "MPL-99",
        "title": "Mars Polar Lander: The Touchdown Sensor Mystery",
        "target": "Mars - South Polar Terrain (Planum Australe)",
        "dateRange": "1999",
        "mystery": "The lander entered the atmosphere, deployed its parachute, and fired descent engines... then was never heard from again. What happened?",
        "endingType": "Impact Loss During Landing",
        "badge": "MPL-POLAR-CADET",
        "badgeIcon": "❄️",
        "hardwareDiagram": "lander_mpl",
        "interactiveComponents": [
          {
            "id": "landing_legs",
            "name": "Deployable Landing Leg Sensors",
            "status": "MICROSWITCH BOUNCE AT 1,500M",
            "statusType": "suspected",
            "description": "When the 3 legs clicked open at 1,500m altitude, mechanical vibration triggered false touchdown pulses.",
            "silentStory": "The flight computer code was programmed to shut down the engines the instant any leg switch triggered... even if 40 meters high!"
          },
          {
            "id": "terminal_engines",
            "name": "Pulsed Hydrazine Descent Thrusters",
            "status": "PREMATURE CUTOFF",
            "statusType": "suspected",
            "description": "Cut off at 40 meters in the air, leaving the lander to freefall into polar rocks at 50 mph.",
            "silentStory": "Without engines, gravity pulled it down in total radio silence."
          }
        ],
        "clues": [
          {
            "title": "No Descent Telemetry Link",
            "type": "confirmed",
            "text": "The lander was programmed not to send radio signals during descent to save mission budget."
          },
          {
            "title": "Leg Deployment Sensor Jitter",
            "type": "suspected",
            "text": "Laboratory testing revealed that folding out the landing legs sent a false 'touchdown' electrical spike."
          },
          {
            "title": "40-Meter Freefall Impact",
            "type": "suspected",
            "text": "If engines shut off at 40 meters, the craft crashed onto icy rocks at 50 mph."
          }
        ],
        "miniGame": {
          "type": "touchdown_sensor",
          "instruction": "DESCENT DEBOUNCE DETECTOR: Filter out false leg sensor bounce spikes before the flight computer prematurely kills the descent engines!"
        },
        "hypotheses": [
          {
            "id": "h1",
            "text": "When the landing legs unfolded at 1,500m, mechanical vibration sent a false touchdown spike that caused thrusters to shut off 40m in the air and crash.",
            "correct": true,
            "explanation": "CONFIRMED AS PROBABLE CAUSE: Ground tests proved leg deployment triggered switches, and software lacked debounce logic."
          },
          {
            "id": "h2",
            "text": "The parachute failed to open, causing the lander to impact the Martian surface at Mach 2.",
            "correct": false,
            "explanation": "INCORRECT: Parachute deployment and aeroshell separation occurred reliably."
          }
        ],
        "historicalDebrief": {
          "whatInvestigatorsProved": "Proved in ground test stands that leg deployment reliably tripped the landing switch, and the flight software lacked debounce logic.",
          "whatRemainsSuspected": "Because no telemetry was returned during EDL, physical wreckage verification has never occurred.",
          "engineeringLegacy": "NASA instituted the mandatory rule: every planetary landing MUST transmit live telemetry during EDL ('Seven Minutes of Terror').",
          "openQuestion": "Where lies the exact resting place of MPL amidst the shifting carbon dioxide frost dunes of Planum Australe?"
        }
      },
      {
        "id": "mars_04_spirit",
        "level": 4,
        "missionNumber": 4,
        "globalLevel": 4,
        "tier": "starter",
        "destination": "mars",
        "codename": "MER-A (Spirit)",
        "title": "Spirit Rover: The Jammed Wheel & Troy Sand Trap",
        "target": "Mars - Gusev Crater & Troy",
        "dateRange": "2003 - 2010",
        "mystery": "Spirit's front wheel jammed in 2006. How did driving backwards for 3 years accidentally discover silica before fatal sand entrapment?",
        "endingType": "Trapped in Soft Sulfate Soil & Winter Freeze",
        "badge": "MER-SPIRIT-CADET",
        "badgeIcon": "⚙️",
        "hardwareDiagram": "rover_spirit",
        "interactiveComponents": [
          {
            "id": "stuck_wheel",
            "name": "Right-Front Drive Actuator Motor",
            "status": "COMMUTATOR BRUSH BURNOUT",
            "statusType": "confirmed",
            "description": "Burned out on Sol 779. Spirit drove backwards dragging the dead wheel like a plow, gouging a trench.",
            "silentStory": "The dragged wheel scraped up pure white silica—proof of ancient volcanic hot springs and habitable hydrothermal vents!"
          },
          {
            "id": "sulfate_crust",
            "name": "Troy Sand Trap",
            "status": "HIGH-CENTERED IN SULFATE",
            "statusType": "confirmed",
            "description": "Spirit broke through a brittle crust into flour-fine sulfate sand, losing traction and resting on its belly.",
            "silentStory": "Trapped with a 5-degree tilt away from the winter sun, the solar panels could not power survival heaters."
          }
        ],
        "clues": [
          {
            "title": "Dragged Dead Wheel Trench",
            "type": "confirmed",
            "text": "The jammed right front wheel dragged along the ground, scraping up white silica dust."
          },
          {
            "title": "Troy Sand Trap Sinking",
            "type": "confirmed",
            "text": "Spinning wheels dug the rover deeper into powdery sulfate sand until its belly touched rock."
          },
          {
            "title": "Winter Sun Angle Deficit",
            "type": "confirmed",
            "text": "Unable to maneuver to a north-facing hill, the solar panels missed the weak winter sun."
          }
        ],
        "miniGame": {
          "type": "rover_drive",
          "instruction": "TROY SAND TRAP ESCAPE: Steer Spirit across treacherous sulfate sand dunes and navigate around basalt boulders to reach the solar ridge!"
        },
        "hypotheses": [
          {
            "id": "h1",
            "text": "After dragging a jammed wheel for 3 years, Spirit broke through a crust into soft sulfate sand and became high-centered, preventing it from tilting toward the winter sun.",
            "correct": true,
            "explanation": "CONFIRMED: The rover bogged down at Troy, high-centered on its underbelly, and could not angle its solar panels to survive the winter."
          },
          {
            "id": "h2",
            "text": "A Martian dust devil blew Spirit upside down into an impact crater.",
            "correct": false,
            "explanation": "INCORRECT: Dust devils actually cleaned the rover's panels multiple times; Martian winds are too thin to flip a rover."
          }
        ],
        "historicalDebrief": {
          "whatInvestigatorsProved": "Confirmed that entrapment in fine powdery sulfate soil at Troy prevented orientation toward the winter sun, starving the battery.",
          "whatRemainsSuspected": "Whether any internal sub-component could still reboot if a whirlwind were to blow the solar panels completely clean.",
          "engineeringLegacy": "Drove the development of rocker-bogie slip sensors, independent 4-wheel steering, and robust terrain hazard avoidance for subsequent rovers.",
          "openQuestion": "Will future human explorers at Gusev Crater recover Spirit and place it in the first Martian Historical Park?"
        }
      }
    ],
    "middle": [
      {
        "id": "mars_05_mgs",
        "level": 1,
        "missionNumber": 5,
        "globalLevel": 5,
        "tier": "middle",
        "destination": "mars",
        "codename": "MGS",
        "title": "Mars Global Surveyor: The Overheated Radiator Command",
        "target": "Mars - Sun-Synchronous Polar Orbit",
        "dateRange": "1996 - 2006",
        "mystery": "After mapping Mars for an unprecedented 10 years, a routine software update caused the orbiter to bake its own battery to death. What happened?",
        "endingType": "Battery Thermal Runaway & Spacecraft Loss",
        "badge": "MGS-THERMAL-ANALYST",
        "badgeIcon": "🛰️",
        "hardwareDiagram": "orbiter_mgs",
        "interactiveComponents": [
          {
            "id": "flight_software",
            "name": "Avionics RAM Parameter Address",
            "status": "WRONG MEMORY OFFSET PATCH",
            "statusType": "confirmed",
            "description": "Five months before failure, ground controllers uploaded a software patch into the wrong memory addresses, corrupting fault-protection logic.",
            "silentStory": "When a solar array motor jammed in November 2006, the corrupted routine pointed the battery radiator directly into the Sun!"
          },
          {
            "id": "battery_radiator",
            "name": "Nickel-Hydrogen Battery Radiator",
            "status": "DIRECT SOLAR OVERHEATING",
            "statusType": "confirmed",
            "description": "Exposed to direct sunlight for hours, battery temperature soared to catastrophic levels, boiling the electrolyte.",
            "silentStory": "The flight computer thought it was safely oriented, while the battery was cooking itself into permanent oblivion."
          }
        ],
        "clues": [
          {
            "title": "Software Upload Address Typo",
            "type": "confirmed",
            "text": "Parameters written into the wrong RAM locations corrupted the safe-mode orientation table."
          },
          {
            "title": "Solar Array Actuator Stall",
            "type": "confirmed",
            "text": "Mechanical resistance tripped the motor, invoking the corrupted autonomous safe-mode routine."
          },
          {
            "title": "Battery Thermal Runaway",
            "type": "confirmed",
            "text": "Telemetry showed battery temperature spiking to over 50°C before all transmission ceased."
          },
          {
            "title": "No Ground Alarm Triggered",
            "type": "confirmed",
            "text": "Flight operations missed the overheating telemetry during the weekend command window."
          }
        ],
        "miniGame": {
          "type": "memory_decrypt",
          "instruction": "EEPROM MEMORY PARITY REPAIR: Re-align corrupted memory registers and fix parity bits to bypass bad flash memory sectors before telemetry loss!"
        },
        "hypotheses": [
          {
            "id": "h1",
            "text": "A software patch with incorrect memory addresses caused the spacecraft in safe mode to rotate its battery radiator directly toward the Sun, cooking the batteries to death.",
            "correct": true,
            "explanation": "CONFIRMED: The NASA Review Board concluded that corrupted parameter addresses rotated the battery radiator toward the Sun, destroying the batteries."
          },
          {
            "id": "h2",
            "text": "A collision with the Martian moon Deimos severed the communications antenna.",
            "correct": false,
            "explanation": "INCORRECT: Orbital tracking confirmed MGS remained in its nominal 400-km science orbit far from Deimos."
          }
        ],
        "historicalDebrief": {
          "whatInvestigatorsProved": "Proved that incorrect memory offsets corrupted safe-mode commands, pointing battery radiators into sunlight.",
          "whatRemainsSuspected": "Whether the spacecraft tumbled after battery exhaustion or remained locked in solar orientation.",
          "engineeringLegacy": "NASA mandated strict parameter-checking scripts and memory checksum audits before and after in-flight memory uploads.",
          "openQuestion": "How can autonomous spacecraft self-simulate uploaded flight code in an isolated sandbox before executing it?"
        }
      },
      {
        "id": "mars_06_pathfinder",
        "level": 2,
        "missionNumber": 6,
        "globalLevel": 6,
        "tier": "middle",
        "destination": "mars",
        "codename": "Pathfinder & Sojourner",
        "title": "Pathfinder: The Real-Time Priority Inversion Bug",
        "target": "Mars - Ares Vallis",
        "dateRange": "1997",
        "mystery": "Days after landing, the Pathfinder computer began repeatedly freezing and rebooting itself on Mars. How did computer scientists debug a deadlock 100M miles away?",
        "endingType": "Real-Time Software Priority Inversion Deadlock",
        "badge": "PATHFINDER-MUTEX-ANALYST",
        "badgeIcon": "💻",
        "hardwareDiagram": "probe_pathfinder",
        "interactiveComponents": [
          {
            "id": "vxworks_kernel",
            "name": "VxWorks Real-Time Operating System",
            "status": "PRIORITY INVERSION MUTEX DEADLOCK",
            "statusType": "confirmed",
            "description": "A low-priority meteorological task acquired an information bus mutex. Medium-priority audio tasks preempted it, preventing high-priority attitude control from running.",
            "silentStory": "The hardware watchdog timer saw the high-priority thread starve and rebooted the spacecraft repeatedly."
          },
          {
            "id": "sojourner_rover",
            "name": "Sojourner Microrover UHF Link",
            "status": "PAUSED DURING REBOOT CYCLES",
            "statusType": "confirmed",
            "description": "The 23-pound microrover waited patiently at the base of the lander while JPL engineers raced to patch kernel flags.",
            "silentStory": "A legend in computer science: engineers remotely toggled the 'priority inheritance' flag in the kernel, curing the bug forever."
          }
        ],
        "clues": [
          {
            "title": "Watchdog Reset Telemetry",
            "type": "confirmed",
            "text": "Computer suffered multiple sudden software resets during high-data downlink passes."
          },
          {
            "title": "Information Bus Mutex Contention",
            "type": "confirmed",
            "text": "Low-priority weather task held shared memory lock, blocked by medium-priority communications tasks."
          },
          {
            "title": "Priority Inheritance Flag Disabled",
            "type": "confirmed",
            "text": "VxWorks mutex initialization had priority inheritance set to FALSE for performance optimization."
          }
        ],
        "miniGame": {
          "type": "circuit_patch",
          "instruction": "PRIORITY INVERSION BREADBOARD PATCH: Connect jumper patch cords between essential power bus, watchdog clock, and mutex bypass relays to stop RTOS reboot loops!"
        },
        "hypotheses": [
          {
            "id": "h1",
            "text": "A classic software priority inversion occurred where a low-priority thread held a mutex, medium-priority tasks starved it, and high-priority flight tasks triggered a watchdog reboot.",
            "correct": true,
            "explanation": "CONFIRMED: This historic bug became the world's most famous case study in real-time operating systems. JPL solved it by remotely enabling priority inheritance."
          },
          {
            "id": "h2",
            "text": "Martian soil dust static electricity shorted the CPU data bus.",
            "correct": false,
            "explanation": "INCORRECT: Hardware diagnostic telemetry verified CPU registers and power buses were physically undamaged."
          }
        ],
        "historicalDebrief": {
          "whatInvestigatorsProved": "Proved that mutex contention between tasks of different priorities starved the critical attitude thread, tripping the hardware watchdog.",
          "whatRemainsSuspected": "The exact number of reboots the system could have sustained before flash file system corruption occurred.",
          "engineeringLegacy": "Made priority inheritance standard practice in aerospace software engineering across all subsequent missions.",
          "openQuestion": "How will distributed multi-agent rover swarms manage mutex contention across asynchronous wireless mesh networks?"
        }
      },
      {
        "id": "mars_07_ds2",
        "level": 3,
        "missionNumber": 7,
        "globalLevel": 7,
        "tier": "middle",
        "destination": "mars",
        "codename": "Deep Space 2",
        "title": "Deep Space 2: The Silent Polar Penetrator Probes",
        "target": "Mars - South Polar Terrain",
        "dateRange": "1999",
        "mystery": "Two basketball-sized probes were dropped at 400 mph into the Martian permafrost to drill for ice. Neither ever spoke. What shattered them?",
        "endingType": "High-G Impact Failure",
        "badge": "DS2-PENETRATOR-ANALYST",
        "badgeIcon": "🎯",
        "hardwareDiagram": "probe_ds2",
        "interactiveComponents": [
          {
            "id": "forebody_penetrator",
            "name": "Titanium Forebody & Micro-Drill",
            "status": "DECELERATION > 30,000 G",
            "statusType": "confirmed",
            "description": "Designed to separate from aftbody and bury 1 meter deep upon hitting frozen soil at 180 m/s.",
            "silentStory": "Ground ballistic tests showed that hitting frozen rock-hard permafrost at an angle shattered internal battery pins."
          },
          {
            "id": "aftbody_antenna",
            "name": "Surface Antenna & UHF Transmitter",
            "status": "COMMUNICATION SHEAR",
            "statusType": "suspected",
            "description": "Remained on the surface connected by a flexible wire. Antenna likely sheared off upon aerodynamic impact.",
            "silentStory": "Neither Amundsen nor Scott penetrator returned a single byte of telemetry."
          }
        ],
        "clues": [
          {
            "title": "30,000 G Dynamic Shock",
            "type": "confirmed",
            "text": "Impact models calculated shock forces exceeding 30,000 times Earth gravity upon permafrost contact."
          },
          {
            "title": "Battery Glass-to-Metal Seal Crack",
            "type": "suspected",
            "text": "Laboratory ballistic cannons revealed that non-rechargeable battery seals ruptured under high angle of attack."
          },
          {
            "title": "Flexible Interconnect Umbilical Snap",
            "type": "suspected",
            "text": "Cable between surface antenna and buried penetrator may have snapped during high-velocity separation."
          }
        ],
        "miniGame": {
          "type": "asteroid_dodge",
          "instruction": "DEEP SPACE METEOROID CORRIDOR: Steer the ballistic probe through dense micrometeorite streams and collect telemetry data packets before atmospheric entry!"
        },
        "hypotheses": [
          {
            "id": "h1",
            "text": "High-G impact shock (>30,000 G) on frozen terrain sheared the surface antenna cable and shattered internal battery pins, preventing any radio beacon transmission.",
            "correct": true,
            "explanation": "CONFIRMED AS PROBABLE CAUSE: Post-flight failure boards concluded DS-2 failed due to structural battery shock or sheared antenna interconnects upon high-G impact."
          },
          {
            "id": "h2",
            "text": "The probes burned up in the upper atmosphere due to missing thermal heat shields.",
            "correct": false,
            "explanation": "INCORRECT: The aeroshells were constructed of proven silicone-impregnated ceramic that survived atmospheric entry."
          }
        ],
        "historicalDebrief": {
          "whatInvestigatorsProved": "Proved that high-velocity kinetic penetrators without descent parachutes require extreme component shock qualification exceeding 60,000 G.",
          "whatRemainsSuspected": "Whether the drills successfully operated underground despite the severed surface antenna.",
          "engineeringLegacy": "Led to the development of crushed-foam crushable energy absorbers for future rough-landing planetary probes.",
          "openQuestion": "Can penetrator microprobes survive kinetic impacts into hard comet ice to sample pristine primordial organics?"
        }
      },
      {
        "id": "mars_08_phoenix",
        "level": 4,
        "missionNumber": 8,
        "globalLevel": 8,
        "tier": "middle",
        "destination": "mars",
        "codename": "Phoenix Lander",
        "title": "Phoenix: The Polar Winter Ice Sheet Crushing",
        "target": "Mars - Vastitas Borealis (North Polar Plains)",
        "dateRange": "2007 - 2010",
        "mystery": "Phoenix confirmed pure water ice under Martian soil in 2008. But why did orbiters photograph its solar panels physically snapped in two during 2010?",
        "endingType": "Crushed by Carbon Dioxide Dry-Ice Snowpack",
        "badge": "PHOENIX-POLAR-ANALYST",
        "badgeIcon": "🧊",
        "hardwareDiagram": "lander_phoenix",
        "interactiveComponents": [
          {
            "id": "circular_solar_array",
            "name": "Ultraflex Circular Solar Arrays",
            "status": "STRUCTURAL FRACTURE UNDER CO2 ICE",
            "statusType": "confirmed",
            "description": "Martian polar winter deposited several feet of solid carbon dioxide dry-ice frost atop the horizontal panels.",
            "silentStory": "The immense weight of frozen carbon dioxide snow exceeded panel load ratings, snapping the carbon-fiber struts."
          },
          {
            "id": "robotic_arm_teco",
            "name": "Robotic Arm & TEGA Oven",
            "status": "DELIVERED WATER ICE BEFORE WINTER",
            "statusType": "confirmed",
            "description": "Melted Martian ice samples in thermal ovens, confirming H2O vapor and perchlorate salts.",
            "silentStory": "Phoenix transmitted until November 2, 2008, when the Sun dipped below the horizon for the dark northern winter."
          }
        ],
        "clues": [
          {
            "title": "MRO HiRISE 2010 Photo Comparison",
            "type": "confirmed",
            "text": "Orbiter imagery confirmed one solar panel was severed and the other severely bowed under dry ice."
          },
          {
            "title": "Solid CO2 Icepack Thickness (1.5 Meters)",
            "type": "confirmed",
            "text": "Atmospheric models proved winter frost buildup weighed over 100 kilograms per square meter."
          },
          {
            "title": "Solar Zenith Sunset",
            "type": "confirmed",
            "text": "Sun remained below the northern horizon for 150 consecutive days, cutting power to 0 Watts."
          }
        ],
        "miniGame": {
          "type": "spectrometer_hunter",
          "instruction": "TEGA MASS SPECTROMETER ICE SWEEP: Tune the thermal evolved-gas analyzer across bake-out mass channels to detect subsurface Martian perchlorates and water ice!"
        },
        "hypotheses": [
          {
            "id": "h1",
            "text": "The relentless accumulation of heavy carbon dioxide dry-ice frost during the dark polar winter physically crushed and severed the horizontal solar arrays.",
            "correct": true,
            "explanation": "CONFIRMED: HiRISE imagery in 2010 proved the solar arrays had buckled and broken under the weight of solid CO2 icepack."
          },
          {
            "id": "h2",
            "text": "A subsurface methane pocket erupted beneath the lander, throwing it onto its side.",
            "correct": false,
            "explanation": "INCORRECT: Geologic imaging confirmed the landing platform was stationary; damage was purely from seasonal surface frost weight."
          }
        ],
        "historicalDebrief": {
          "whatInvestigatorsProved": "Confirmed that northern polar plains accumulate massive dry-ice snowpacks capable of structurally crushing exposed space hardware.",
          "whatRemainsSuspected": "Whether the lander's central electronics bus could have survived the cryogenic chill if the panels had not snapped.",
          "engineeringLegacy": "Demonstrated that surface hardware stationed at Martian poles must be designed with steep shedding angles or nuclear RTG heat sources.",
          "openQuestion": "What is the seasonal sublimation rate of Martian polar CO2 frost under changing orbital obliquity cycles?"
        }
      }
    ],
    "advanced": [
      {
        "id": "mars_09_insight",
        "level": 1,
        "missionNumber": 9,
        "globalLevel": 9,
        "tier": "advanced",
        "destination": "mars",
        "codename": "InSight Lander",
        "title": "InSight: The Jammed 'Mole' & Solar Dust Asphyxiation",
        "target": "Mars - Elysium Planitia",
        "dateRange": "2018 - 2022",
        "mystery": "Why did the German HP3 heat probe ('The Mole') get stuck after digging only 30 centimeters, and why did robotic scoop dusting fail to revive the dying lander?",
        "endingType": "Soil Duricrust Cohesion & Solar Dust Starvation",
        "badge": "INSIGHT-SEISMIC-LEAD",
        "badgeIcon": "🔬",
        "hardwareDiagram": "lander_insight",
        "interactiveComponents": [
          {
            "id": "hp3_mole",
            "name": "HP3 Heat Flow & Physical Properties Probe",
            "status": "LACK OF SOIL FRICTION (REBOUND)",
            "statusType": "confirmed",
            "description": "Unexpected cement-like 'duricrust' soil lacked friction, causing the self-hammering mole to bounce backward out of the hole.",
            "silentStory": "Engineers used the robotic scoop to pin the mole against the hole wall, eventually burying it before running out of power."
          },
          {
            "id": "seis_seismometer",
            "name": "SEIS Ultra-Sensitive Seismometer",
            "status": "DETECTED 1,300+ MARSQUAKES",
            "statusType": "confirmed",
            "description": "Mapped Mars's liquid iron core and mantle boundaries until solar power collapsed below the science threshold.",
            "silentStory": "InSight's heartbreaking final transmission on Dec 19, 2022: 'My power's really low, so this may be the last image I can send.'"
          }
        ],
        "clues": [
          {
            "title": "Duricrust Soil Cohesion Anomaly",
            "type": "confirmed",
            "text": "Elysium Planitia soil cemented into a hard 20-cm crust that did not collapse into the hole to provide friction."
          },
          {
            "title": "Mole Hammering Recoil Telemetry",
            "type": "confirmed",
            "text": "Internal stroke accelerometer showed recoil spring was pushing the mole upward due to zero lateral soil pressure."
          },
          {
            "title": "Solar Array Power: 285 Wh/sol",
            "type": "confirmed",
            "text": "Thick red dust blanketed the 7-meter solar arrays, reducing power from 5,000 Wh to under 300 Wh."
          },
          {
            "title": "Wind Cleansing Failure",
            "type": "confirmed",
            "text": "Zero cleaning vortex events occurred at Elysium Planitia over the entire 4-year science mission."
          }
        ],
        "miniGame": {
          "type": "circuit_patch",
          "instruction": "SEIS SENSOR TETHER JUMPER: Patch the ultra-sensitive broadband seismometer sensor tether and override thermal noise shielding!"
        },
        "hypotheses": [
          {
            "id": "h1",
            "text": "Unforeseen cement-like duricrust prevented the mole from gaining friction, while unrelenting atmospheric dust deposition choked the solar arrays to zero power.",
            "correct": true,
            "explanation": "CONFIRMED: The unexpected soil properties prevented deep thermal drilling, and electrostatic dust accumulation sealed the lander's fate in Dec 2022."
          },
          {
            "id": "h2",
            "text": "A Magnitude 8 marsquake cracked the titanium landing struts, causing the lander to tip over.",
            "correct": false,
            "explanation": "INCORRECT: InSight's largest detected marsquake was Magnitude 4.7, which produced no structural damage."
          }
        ],
        "historicalDebrief": {
          "whatInvestigatorsProved": "Confirmed that Martian regolith in Elysium Planitia exhibits cementation duricrust with low friction, and dust deposition is relentless without wind cleaning.",
          "whatRemainsSuspected": "The exact internal temperature of Mars's core, since the mole could not reach the 3-meter thermal gradient depth.",
          "engineeringLegacy": "Demonstrated that future subsurface planetary drills must use continuous rotary auger mechanisms rather than friction-dependent percussion moles.",
          "openQuestion": "How do seasonal atmospheric waves trigger planet-encircling dust storms from regional localized dust devils?"
        }
      },
      {
        "id": "mars_10_mariner4",
        "level": 2,
        "missionNumber": 10,
        "globalLevel": 10,
        "tier": "advanced",
        "destination": "mars",
        "codename": "Mariner 4",
        "title": "Mariner 4: The 6-Millibar Atmosphere Shock & Micrometeorite Storm",
        "target": "Mars - 9,846 km Close Flyby",
        "dateRange": "1964 - 1967",
        "mystery": "Scientists in 1965 believed Mars had a dense atmosphere capable of supporting winged gliders. How did radio occultation shatter that dream in 12 minutes?",
        "endingType": "Micrometeoroid Shower & Atmospheric Revelation",
        "badge": "MARINER-OCCULTATION-LEAD",
        "badgeIcon": "📡",
        "hardwareDiagram": "probe_mariner",
        "interactiveComponents": [
          {
            "id": "radio_occultation",
            "name": "S-Band Radio Transmitter & Clock",
            "status": "REFRACTED BY 6-MILLIBAR AIR",
            "statusType": "confirmed",
            "description": "As the radio beam dipped behind the limb of Mars, refraction revealed atmospheric pressure was only 6 mb—not 100 mb as previously assumed!",
            "silentStory": "This historic 12-minute measurement completely revolutionized space exploration: future Mars landers would need parachutes and retrorockets, not wings."
          },
          {
            "id": "cosmic_dust_detector",
            "name": "Acoustic Micrometeorite Plate",
            "status": "17 HITS IN 15 MINUTES (1967)",
            "statusType": "confirmed",
            "description": "In September 1967, Mariner 4 flew through a previously unknown meteoroid stream, suffering multiple structural hits that degraded attitude control.",
            "silentStory": "The spacecraft survived the flyby, but was battered by debris until contact was terminated in December 1967."
          }
        ],
        "clues": [
          {
            "title": "S-Band Phase Shift Data",
            "type": "confirmed",
            "text": "Refraction timing confirmed surface atmospheric pressure was 4.1 to 7.0 millibars (under 1% of Earth's atmosphere)."
          },
          {
            "title": "Carbon Dioxide Composition Dominance",
            "type": "confirmed",
            "text": "Radio data proved the thin atmosphere was over 95% pure carbon dioxide with no ozone layer."
          },
          {
            "title": "1967 Micrometeorite Shower Telemetry",
            "type": "confirmed",
            "text": "Acoustic sensors recorded a spike in micrometeoroid impacts, causing temporary attitude tumbling."
          }
        ],
        "miniGame": {
          "type": "asteroid_dodge",
          "instruction": "INTERPLANETARY METEOROID FLUX: Pilot Mariner 4 through the outer micrometeorite flux belt while collecting scientific telemetry packets!"
        },
        "hypotheses": [
          {
            "id": "h1",
            "text": "Radio occultation proved Mars's atmosphere was a razor-thin 6 millibars of pure CO2, disproving theories of dense air and forcing NASA to abandon winged glider designs.",
            "correct": true,
            "explanation": "CONFIRMED: Mariner 4's occultation experiment showed surface pressure was only 6 millibars, completely changing future planetary landing architecture."
          },
          {
            "id": "h2",
            "text": "Mariner 4 detected dense oxygen clouds and active surface vegetation near the equator.",
            "correct": false,
            "explanation": "INCORRECT: Imagery and spectroscopy proved Mars was a cratered, frozen desert devoid of dense air."
          }
        ],
        "historicalDebrief": {
          "whatInvestigatorsProved": "Proved that Mars has an extremely thin (6 millibar) CO2 atmosphere and no global dipolar magnetic field.",
          "whatRemainsSuspected": "The parent comet responsible for the 1967 micrometeoroid stream that pelted the spacecraft.",
          "engineeringLegacy": "Led directly to the aeroshell-plus-parachute landing systems used by Viking, Pathfinder, and Curiosity.",
          "openQuestion": "How much of Mars's primordial dense atmosphere was stripped away by solar wind sputtering over 4 billion years?"
        }
      },
      {
        "id": "mars_11_mariner9",
        "level": 3,
        "missionNumber": 11,
        "globalLevel": 11,
        "tier": "advanced",
        "destination": "mars",
        "codename": "Mariner 9",
        "title": "Mariner 9: The Global Dust Cloud & The Volcano Calderas",
        "target": "Mars - First Artificial Satellite in Mars Orbit",
        "dateRange": "1971 - 1972",
        "mystery": "Arriving at Mars in 1971, the camera showed only a featureless brown ball. Soviet orbiters dropped their landers into the storm and crashed. How did NASA save Mariner 9?",
        "endingType": "Orbit Insertion & Gas Depletion Shutdown",
        "badge": "MARINER-CALDERA-LEAD",
        "badgeIcon": "🌋",
        "hardwareDiagram": "orbiter_mco",
        "interactiveComponents": [
          {
            "id": "attitude_nitrogen",
            "name": "Cold Gas Nitrogen Thruster Tanks",
            "status": "DEPLETED AFTER 349 DAYS",
            "statusType": "confirmed",
            "description": "NASA waited out the global dust storm for 6 weeks, then mapped 70% of the planet including the 25-km high Olympus Mons.",
            "silentStory": "On October 27, 1972, attitude control nitrogen ran dry; NASA transmitted the final command to shut down the transmitter."
          },
          {
            "id": "vidicon_television_camera",
            "name": "Dual Vidicon TV Camera System",
            "status": "DISCOVERED ANCIENT RIVERBEDS",
            "statusType": "confirmed",
            "description": "Revealed massive canyon Valles Marineris (named in honor of the spacecraft) and dry channels carved by ancient floods.",
            "silentStory": "Mariner 9 remains in Mars orbit today; it will not burn up in the atmosphere until approximately 2022-2070."
          }
        ],
        "clues": [
          {
            "title": "Planet-Wide Storm Opacity: 100%",
            "type": "confirmed",
            "text": "When Mariner 9 arrived in November 1971, the entire planet was concealed by a massive dust storm."
          },
          {
            "title": "Soviet Mars 2 & 3 Landers Crash",
            "type": "confirmed",
            "text": "Pre-programmed Soviet landers entered the storm blind and failed; NASA reprogrammed Mariner 9 to wait."
          },
          {
            "title": "Pinnacles Above Dust (Tharsis Volcanoes)",
            "type": "confirmed",
            "text": "As dust began settling, four mysterious dark spots emerged—the calderas of gigantic shield volcanoes!"
          }
        ],
        "miniGame": {
          "type": "orbital_slingshot",
          "instruction": "MARS ORBITAL INSERTION BURN: Calibrate trajectory angle and time the liquid retro-engine Delta-V to achieve the first human-made orbit around another planet!"
        },
        "hypotheses": [
          {
            "id": "h1",
            "text": "NASA reprogrammed the orbiter to wait out a planet-encircling dust storm that destroyed rival Soviet landers, discovering giant volcanoes and ancient riverbeds once the air cleared.",
            "correct": true,
            "explanation": "CONFIRMED: Mariner 9's dynamic mission flexibility allowed it to wait out the storm, becoming the first craft to map Mars's volcanoes and canyons."
          },
          {
            "id": "h2",
            "text": "The spacecraft crashed into the Martian moon Phobos due to navigation orbit calculation error.",
            "correct": false,
            "explanation": "INCORRECT: Mariner 9 successfully photographed Phobos and Deimos from stable orbit."
          }
        ],
        "historicalDebrief": {
          "whatInvestigatorsProved": "Confirmed that Mars possesses massive volcanic shields, a 4,000-km rift canyon, and dried river channels indicating ancient liquid water.",
          "whatRemainsSuspected": "The exact year when Mariner 9's decaying orbit will finally enter the upper Martian atmosphere.",
          "engineeringLegacy": "Demonstrated the vital importance of reprogrammable in-flight spacecraft command architecture.",
          "openQuestion": "When did the last volcanic eruptions occur at the Olympus Mons caldera?"
        }
      },
      {
        "id": "mars_12_curiosity",
        "level": 4,
        "missionNumber": 12,
        "globalLevel": 12,
        "tier": "advanced",
        "destination": "mars",
        "codename": "Curiosity (MSL)",
        "title": "Curiosity: Ventifact Wheel Gashes & The Percussion Drill Short",
        "target": "Mars - Gale Crater & Mount Sharp",
        "dateRange": "2012 - Present",
        "mystery": "Why did razor-sharp 'ventifact' rocks puncture holes in Curiosity's aluminum wheels, and how did JPL invent a new drilling method after an internal electrical short?",
        "endingType": "Hardware Damage Adaptation & Active Science",
        "badge": "CURIOSITY-WHEEL-LEAD",
        "badgeIcon": "🔬",
        "hardwareDiagram": "rover_curiosity",
        "interactiveComponents": [
          {
            "id": "machined_aluminum_wheels",
            "name": "0.75-mm Machined Aluminum Wheels",
            "status": "PUNCTURES & GASHES FROM VENTIFACTS",
            "statusType": "confirmed",
            "description": "Sharp wind-carved basalt rocks punctured the thin aluminum treads in 2013, forcing JPL to develop traction control algorithms.",
            "silentStory": "Engineers drive backwards and avoid caprock terrain to preserve the wheel grousers for another decade."
          },
          {
            "id": "percussion_drill_feed",
            "name": "Sample Drill Percussion Mechanism",
            "status": "ELECTRICAL SHORT CIRCUIT (2016)",
            "statusType": "confirmed",
            "description": "Internal drill feed brake suffered an intermittent short. JPL invented 'Feed-Extended Drilling' using rover arm force instead of the drill feed.",
            "silentStory": "Engineers restored sample collection on a different planet by changing how the robotic arm pushed into rock."
          }
        ],
        "clues": [
          {
            "title": "Wheel Puncture Telemetry MAHLI",
            "type": "confirmed",
            "text": "Hand lens camera documented tears in aluminum wheel skin caused by rigid, cemented ventifact rocks."
          },
          {
            "title": "Drill Feed Actuator Intermittent Short",
            "type": "confirmed",
            "text": "Drill percussion mechanism shorted out against the motor winding casing on Sol 1536."
          },
          {
            "title": "Traction Control Algorithm Patch",
            "type": "confirmed",
            "text": "Software update regulated individual wheel speeds to reduce wheel dragging across sharp terrain."
          }
        ],
        "miniGame": {
          "type": "rover_drive",
          "instruction": "GALE CRATER VENTIFACT HAZARD DRIVE: Navigate Curiosity across sharp knife-like bedrock ventifacts to protect aluminum wheels and reach the Mount Sharp waypoint!"
        },
        "hypotheses": [
          {
            "id": "h1",
            "text": "Sharp cemented ventifact rocks punctured the rover's thin aluminum wheels, while an electrical short in the drill feed forced engineers to invent a brand new drilling technique.",
            "correct": true,
            "explanation": "CONFIRMED: JPL adapted to punctured wheels by driving across soft sand and rewrote flight code to drill using rover arm force alone."
          },
          {
            "id": "h2",
            "text": "Curiosity's MMRTG nuclear power supply leaked radioactive coolant, shutting down the main computer.",
            "correct": false,
            "explanation": "INCORRECT: The solid-state thermoelectric generator has operated flawlessly for over 12 years."
          }
        ],
        "historicalDebrief": {
          "whatInvestigatorsProved": "Proved that thin-skinned rover wheels suffer severe mechanical puncture from ventifact caprock when wheel rotation is uncoordinated.",
          "whatRemainsSuspected": "The maximum remaining mileage the wheels can sustain before inner structural rim failure occurs.",
          "engineeringLegacy": "Resulted in thicker, curved-tread titanium-cleated wheels for the Perseverance rover to eliminate puncture vulnerability.",
          "openQuestion": "What preserved the organic molecules discovered by Curiosity in Gale Crater mudstone for over 3.5 billion years?"
        }
      }
    ]
  },
  "moon": {
    "starter": [
      {
        "id": "moon_01_apollo13",
        "level": 1,
        "missionNumber": 1,
        "globalLevel": 13,
        "tier": "starter",
        "destination": "moon",
        "codename": "Apollo 13",
        "title": "Apollo 13: The Exploding Oxygen Tank & The Lifeboat",
        "target": "Moon - Free-Return Slingshot",
        "dateRange": "April 1970",
        "mystery": "56 hours into a voyage to the Moon, an explosion blew off an entire 13-foot side panel. How did 3 astronauts survive in a tiny lunar lander?",
        "endingType": "Mission Aborted; Crew Rescued",
        "badge": "APOLLO-13-CADET",
        "badgeIcon": "🚀",
        "hardwareDiagram": "apollo_sm",
        "interactiveComponents": [
          {
            "id": "cryo_tank2",
            "name": "Oxygen Tank #2",
            "status": "TEFLON INSULATION ARC EXPLOSION",
            "statusType": "confirmed",
            "description": "Damaged wire insulation caught fire when stirred, blowing off the outer metal bay door and venting breathing oxygen.",
            "silentStory": "Astronaut Jim Lovell looked out the window and radioed: 'Houston, we are venting something out into space.'"
          },
          {
            "id": "lunar_module",
            "name": "LM 'Aquarius' Lifeboat",
            "status": "EMERGENCY POWER & OXYGEN LIFEBOAT",
            "statusType": "confirmed",
            "description": "Built for 2 men for 45 hours on the Moon. Kept 3 men alive for nearly 90 hours on a freezing trajectory around the Moon.",
            "silentStory": "The cabin dropped to 38°F with condensation coating every switch, but the crew made it safely home."
          },
          {
            "id": "co2_scrubber",
            "name": "Cardboard & Duct Tape CO2 Adapter",
            "status": "SQUARE PEG IN ROUND HOLE",
            "statusType": "confirmed",
            "description": "Command module air filters were square; the lander had round holes. Astronauts built an adapter using flight suits, cardboard, and gray tape.",
            "silentStory": "Mission Control tested the makeshift adapter in Houston before radioing the step-by-step instructions."
          }
        ],
        "clues": [
          {
            "title": "Oxygen Pressure Drops to Zero",
            "type": "confirmed",
            "text": "Telemetry showed Oxygen Tank 2 exploded and broke Tank 1's valves, bleeding breathing air into space."
          },
          {
            "title": "13-Foot Panel Blown Off",
            "type": "confirmed",
            "text": "When the Service Module was jettisoned before reentry, astronauts saw Bay 4 was completely blown open."
          },
          {
            "title": "65-Volt Pre-Launch Overheat",
            "type": "confirmed",
            "text": "Heaters operated at 65V instead of 28V during ground detanking at Cape Kennedy, melting wire insulation."
          }
        ],
        "miniGame": {
          "type": "lifeboat_power",
          "instruction": "LIFEBOAT EMERGENCY ROUTING: Shut down non-critical heaters to keep current under 15 Amps and connect the emergency CO2 scrubber!"
        },
        "hypotheses": [
          {
            "id": "h1",
            "text": "Pre-launch ground testing melted internal wiring insulation of Oxygen Tank #2; flipping the cryo-fan switch sparked an electrical fire that blew out the bay.",
            "correct": true,
            "explanation": "CONFIRMED: The Cortright Commission proved the 65V ground detank melted Teflon insulation. Flipping the fan switch sparked an internal fire."
          },
          {
            "id": "h2",
            "text": "A meteoroid punched through the Command Module crew cabin, venting air.",
            "correct": false,
            "explanation": "INCORRECT: The crew cabin was intact; the explosion occurred in the Service Module cryogenic bay."
          }
        ],
        "historicalDebrief": {
          "whatInvestigatorsProved": "Proved that thermostat contacts welded shut during pre-launch heater boil-off at the Cape, baking wiring insulation.",
          "whatRemainsSuspected": "Whether the Service Module engine could have safely fired or would have suffered an uncontained combustion chamber explosion.",
          "engineeringLegacy": "Redesigned Apollo oxygen tanks with stainless-steel conduit tubes and added a third isolated emergency oxygen tank.",
          "openQuestion": "How do modern Artemis moon missions design redundant life-support architecture that can survive multi-point subsystem blowouts?"
        }
      },
      {
        "id": "moon_02_lcross",
        "level": 2,
        "missionNumber": 2,
        "globalLevel": 14,
        "tier": "starter",
        "destination": "moon",
        "codename": "LCROSS",
        "title": "LCROSS: The Cabeus Crater Kinetic Ice Plume",
        "target": "Moon - South Pole Cabeus Crater",
        "dateRange": "2009",
        "mystery": "Why did NASA deliberately smash a 2-ton spent Centaur rocket into the freezing shadows of the lunar south pole, and what did the plume reveal?",
        "endingType": "Kinetic Impact Discovery",
        "badge": "LCROSS-WATER-CADET",
        "badgeIcon": "🌊",
        "hardwareDiagram": "lcross_probe",
        "interactiveComponents": [
          {
            "id": "centaur_upper",
            "name": "Centaur Upper Stage Impactor",
            "status": "IMPACT AT 5,600 MPH",
            "statusType": "confirmed",
            "description": "Excavated ~350 metric tons of lunar dirt from the pitch-black floor of Cabeus crater into sunlight.",
            "silentStory": "The soil had been trapped in pitch darkness at -240°C for over one billion years."
          },
          {
            "id": "shepherding_sc",
            "name": "Near-Infrared Spectrometer",
            "status": "FLEW THROUGH PLUME",
            "statusType": "confirmed",
            "description": "Chaser probe analyzed sunlight passing through the dust cloud 4 minutes later, detecting water vapor absorption!",
            "silentStory": "Confirmed that permanently shadowed craters trap billions of gallons of pure water ice."
          }
        ],
        "clues": [
          {
            "title": "Permanently Shadowed Craters (PSRs)",
            "type": "confirmed",
            "text": "Crater floors at the lunar south pole never see sunlight and are colder than the surface of Pluto."
          },
          {
            "title": "Water Ice Signature at 1.45 µm",
            "type": "confirmed",
            "text": "Near-infrared sensors detected distinctive dips in light caused by water molecules and hydroxyl."
          },
          {
            "title": "Pure Water Ice: 5.5% of Soil",
            "type": "suspected",
            "text": "Scientists estimated water ice makes up over 5% of the soil mass inside the crater floor."
          }
        ],
        "miniGame": {
          "type": "spectrometer_hunter",
          "instruction": "CABEUS PLUME SPECTROMETRY: Tune the near-infrared spectrometer through the illuminated ejecta plume to lock onto the water ice (1.45 µm) absorption band!"
        },
        "hypotheses": [
          {
            "id": "h1",
            "text": "The kinetic impact blasted pristine soil from a permanently shadowed crater into sunlight, proving the presence of billions of gallons of water ice on the Moon.",
            "correct": true,
            "explanation": "CONFIRMED: LCROSS confirmed that permanently shadowed lunar craters trap massive reservoirs of water ice (5.5% by mass), revolutionizing lunar exploration."
          },
          {
            "id": "h2",
            "text": "The rocket struck an underground liquid lake beneath the lunar crust.",
            "correct": false,
            "explanation": "INCORRECT: Temperatures in lunar polar craters are -240°C; all water exists as microscopic frozen ice crystals mixed with regolith."
          }
        ],
        "historicalDebrief": {
          "whatInvestigatorsProved": "Confirmed that water ice exists in substantial quantities inside permanently shadowed craters of the lunar south pole.",
          "whatRemainsSuspected": "The exact lateral distribution and vertical depth of the ice deposits across adjacent craters.",
          "engineeringLegacy": "Made the lunar south pole the prime landing target for NASA's Artemis program to mine fuel and oxygen.",
          "openQuestion": "Did the lunar water originate from cometary bombardments, ancient volcanic outgassing, or solar wind proton implantation?"
        }
      },
      {
        "id": "moon_03_surveyor2",
        "level": 3,
        "missionNumber": 3,
        "globalLevel": 15,
        "tier": "starter",
        "destination": "moon",
        "codename": "Surveyor 2",
        "title": "Surveyor 2: The Uncommanded Vernier Death Spin",
        "target": "Moon - Sinus Medii",
        "dateRange": "September 1966",
        "mystery": "Before humans landed, Surveyors proved lunar soil could support weight. Why did Surveyor 2 begin an uncontrollable 136 RPM spin and crash?",
        "endingType": "Asymmetric Thrust Spin-Out",
        "badge": "SURVEYOR-CADET",
        "badgeIcon": "📡",
        "hardwareDiagram": "lander_surveyor",
        "interactiveComponents": [
          {
            "id": "vernier_engine",
            "name": "Vernier Engine #3 Throttle Valve",
            "status": "FAILED TO IGNITE",
            "statusType": "confirmed",
            "description": "Engine 3 failed to fire during a midcourse correction burn. With only engines 1 and 2 firing, unbalanced thrust spun the craft.",
            "silentStory": "The spacecraft began an unrecoverable 136 RPM tumble toward the lunar rocks."
          },
          {
            "id": "attitude_gyros",
            "name": "Attitude Control Gyroscopes",
            "status": "MECHANICAL STOPS EXCEEDED",
            "statusType": "confirmed",
            "description": "Gyros hit mechanical stops at 136 RPM. Ground controllers sent 39 restart pulses with zero response.",
            "silentStory": "Surveyor 2 impacted the Moon at 5,800 mph near Copernicus crater."
          }
        ],
        "clues": [
          {
            "title": "Asymmetric Thrust Death Spin",
            "type": "confirmed",
            "text": "When Vernier Engine 3 failed to ignite, the off-center thrust spun Surveyor 2 like a top."
          },
          {
            "title": "39 Failed Restart Pulses",
            "type": "confirmed",
            "text": "Ground controllers commanded engine #3 to fire 39 times with zero response."
          },
          {
            "title": "Sinus Medii Impact Ejecta",
            "type": "confirmed",
            "text": "The spacecraft crashed into the Moon at over 5,000 miles per hour."
          }
        ],
        "miniGame": {
          "type": "lunar_lander",
          "instruction": "VERNIER THRUSTER STABILIZATION: Control attitude tilt and throttle vernier engines to arrest fatal rotational tumble and attempt emergency lunar touchdown!"
        },
        "hypotheses": [
          {
            "id": "h1",
            "text": "A stuck mechanical fuel valve prevented Vernier Engine 3 from igniting, producing asymmetric thrust that induced an unrecoverable 136 RPM tumble into the Moon.",
            "correct": true,
            "explanation": "CONFIRMED: A stuck valve in engine #3 prevented ignition, creating catastrophic rotational torque that destroyed the mission."
          },
          {
            "id": "h2",
            "text": "Lunar soil swallowed the spacecraft into a 50-meter deep pit of dust.",
            "correct": false,
            "explanation": "INCORRECT: Other Surveyors proved the lunar soil had a bearing strength capable of supporting human spacecraft."
          }
        ],
        "historicalDebrief": {
          "whatInvestigatorsProved": "Confirmed that a single valve failure in multi-engine systems causes fatal asymmetric torque without emergency cross-feed isolation.",
          "whatRemainsSuspected": "Whether the valve failed due to particulate contamination or electrical solenoid coil burnout.",
          "engineeringLegacy": "Mandated single-engine descent designs with mechanical simplicity (as used in the Apollo Lunar Module) rather than complex multiple verniers.",
          "openQuestion": "Did microbes discovered on Surveyor 3's camera returned by Apollo 12 survive 2.5 years on the Moon, or were they contaminated post-return?"
        }
      },
      {
        "id": "moon_04_apollo11",
        "level": 4,
        "missionNumber": 4,
        "globalLevel": 16,
        "tier": "starter",
        "destination": "moon",
        "codename": "Apollo 11",
        "title": "Apollo 11: The 1202 Alarm & The West Crater Boulders",
        "target": "Moon - Sea of Tranquility",
        "dateRange": "July 20, 1969",
        "mystery": "Three minutes before the historic first landing, the computer sounded emergency alarms '1202' and '1201'. Why was it rebooting, and why did Armstrong take manual control?",
        "endingType": "Historic Landing with 25s Propellant Margin",
        "badge": "APOLLO-11-CADET",
        "badgeIcon": "🌕",
        "hardwareDiagram": "apollo_lm",
        "interactiveComponents": [
          {
            "id": "apollo_guidance_computer",
            "name": "Apollo Guidance Computer (AGC)",
            "status": "EXECUTIVE OVERFLOW (1202 / 1201)",
            "statusType": "confirmed",
            "description": "Rendezvous radar switch was left in the SLEW position, flooding the computer with meaningless cycle-stealing interrupts (15% overload).",
            "silentStory": "Margaret Hamilton's asynchronous software architecture saved the mission: it dropped low-priority tasks and prioritized rocket thruster firing!"
          },
          {
            "id": "landing_site_boulders",
            "name": "West Crater Boulder Field",
            "status": "MANUAL DODGE EXECUTED",
            "statusType": "confirmed",
            "description": "Automated guidance was flying Eagle directly into a stadium-sized crater surrounded by automobile-sized boulders.",
            "silentStory": "Neil Armstrong took manual control and flew horizontally across the lunar plain with only 25 seconds of fuel remaining."
          }
        ],
        "clues": [
          {
            "title": "Rendezvous Radar Switch Position",
            "type": "confirmed",
            "text": "The radar switch was in the wrong mode, flooding the computer with 800 unnecessary interrupts every second."
          },
          {
            "title": "Automated Path Into Giant Boulders",
            "type": "confirmed",
            "text": "The computer was aiming straight into boulder-strewn West Crater; Armstrong took manual control."
          },
          {
            "title": "Descent Fuel Near Exhaustion",
            "type": "confirmed",
            "text": "When Armstrong announced 'The Eagle has landed', only 25 seconds of usable descent fuel remained."
          }
        ],
        "miniGame": {
          "type": "lunar_lander",
          "instruction": "EAGLE POWERED DESCENT: Steer the Lunar Module past hazardous boulder craters, manage throttle descent rate (< 2 m/s), and touch down safely on the landing pad!"
        },
        "hypotheses": [
          {
            "id": "h1",
            "text": "A misplaced radar switch overloaded the AGC with cycle-stealing interrupts, while automated guidance targeted a hazardous boulder field, forcing manual takeover on 25 seconds of fuel.",
            "correct": true,
            "explanation": "CONFIRMED: The rendezvous radar overloaded CPU capacity, triggering 1202 alarms; Armstrong took manual control to avoid West Crater boulders with seconds of fuel left."
          },
          {
            "id": "h2",
            "text": "The descent engine suffered a fuel line puncture from space debris.",
            "correct": false,
            "explanation": "INCORRECT: The Descent Propulsion System fired flawlessly throughout the entire landing sequence."
          }
        ],
        "historicalDebrief": {
          "whatInvestigatorsProved": "Confirmed that Hamilton's asynchronous computer executive preserved mission-critical flight loops despite heavy radar interrupt flooding.",
          "whatRemainsSuspected": "The exact quantity of unusable propellant trapped in tank slosh baffles upon touchdown (post-flight analysis estimated 15 to 30 seconds).",
          "engineeringLegacy": "Cemented the discipline of software engineering; modern aerospace systems rely on priority-scheduled real-time operating systems directly inspired by the AGC.",
          "openQuestion": "How will future autonomous human landers dynamically map hazard craters in dark polar terrain without human intervention?"
        }
      }
    ],
    "middle": [
      {
        "id": "moon_05_surveyor4",
        "level": 1,
        "missionNumber": 5,
        "globalLevel": 17,
        "tier": "middle",
        "destination": "moon",
        "codename": "Surveyor 4",
        "title": "Surveyor 4: The Instant Signal Dropout at T-2.5 Seconds",
        "target": "Moon - Sinus Medii",
        "dateRange": "July 1967",
        "mystery": "Surveyor 4 transmitted perfect telemetry during landing... until exactly 2.5 seconds before retrorocket burnout, when all signals vanished in an instant. What exploded?",
        "endingType": "Sudden Retromotor Rupture or Telemetry Cutoff",
        "badge": "SURVEYOR-4-ANALYST",
        "badgeIcon": "💥",
        "hardwareDiagram": "lander_surveyor",
        "interactiveComponents": [
          {
            "id": "solid_retromotor",
            "name": "Thiokol Solid Retrorocket Motor Casing",
            "status": "TELEMETRY DROP AT T-2.5 SECONDS",
            "statusType": "suspected",
            "description": "Main deceleration motor designed to fire for 40 seconds. Exactly 2.5 seconds before burnout, all radio telemetry stopped.",
            "silentStory": "High-pressure throat erosion or propellant grain cracking may have caused explosive overpressurization of the motor casing."
          },
          {
            "id": "telemetry_transceiver",
            "name": "Central Avionics Power Bus Cable",
            "status": "INSTANT CUTOFF WITH NO DRIFT",
            "statusType": "confirmed",
            "description": "DSN recorded an instantaneous loss of RF carrier with no frequency drift or battery drain signature.",
            "silentStory": "The abrupt signal loss remains one of the Moon's greatest forensic enigmas."
          }
        ],
        "clues": [
          {
            "title": "Carrier Loss Spectral Signature: Sudden Stop",
            "type": "confirmed",
            "text": "Goldstone DSN recorded instantaneous RF carrier loss with zero frequency drift, indicative of physical bus separation or explosion."
          },
          {
            "title": "Solid Motor Thermal Expansion Stress",
            "type": "suspected",
            "text": "Thermal stress cracking in the solid propellant grain may have caused rapid overpressurization."
          },
          {
            "title": "Sinus Medii Impact Search",
            "type": "confirmed",
            "text": "LRO Narrow Angle Camera identified probable impact scar and debris splash in Sinus Medii."
          }
        ],
        "miniGame": {
          "type": "touchdown_sensor",
          "instruction": "TERMINAL DESCENT RADAR LOCK: Filter altimeter sensor noise and verify radar lock during solid retro-rocket burnout seconds before lunar touchdown!"
        },
        "hypotheses": [
          {
            "id": "h1",
            "text": "The solid retrorocket motor casing experienced explosive overpressurization 2.5 seconds before burnout, destroying the spacecraft and instantly severing radio communications.",
            "correct": true,
            "explanation": "CONFIRMED AS PROBABLE CAUSE: Instantaneous signal drop without carrier drift indicates physical destruction of the spacecraft bus by solid motor rupture."
          },
          {
            "id": "h2",
            "text": "Solar flares from the Sun disrupted Earth's Deep Space Network dishes.",
            "correct": false,
            "explanation": "INCORRECT: DSN stations in California and Australia recorded stable solar conditions and were tracking other spacecraft simultaneously."
          }
        ],
        "historicalDebrief": {
          "whatInvestigatorsProved": "Confirmed that the signal loss was instantaneous, proving either an explosion or complete physical severance of the electrical power bus.",
          "whatRemainsSuspected": "Whether the retromotor casing exploded or mechanical shock severed the transmitter cable.",
          "engineeringLegacy": "Led NASA to enforce x-ray radiography inspections of all solid propellant grains on Apollo and robotic lunar landers.",
          "openQuestion": "Can high-resolution lunar orbiters distinguish Surveyor 4's crater blast pattern from natural meteoroid impact sites?"
        }
      },
      {
        "id": "moon_06_prospector",
        "level": 2,
        "missionNumber": 6,
        "globalLevel": 18,
        "tier": "middle",
        "destination": "moon",
        "codename": "Lunar Prospector",
        "title": "Lunar Prospector: The Shoemaker Crater Polar Plunge",
        "target": "Moon - South Pole Shoemaker Crater",
        "dateRange": "1998 - 1999",
        "mystery": "Why did NASA deliberately steer an orbiter carrying the cremated ashes of geologist Eugene Shoemaker to smash into a dark polar crater, and why did Earth telescopes see no plume?",
        "endingType": "Deliberate Kinetic Polar Impact",
        "badge": "PROSPECTOR-ANALYST",
        "badgeIcon": "🔬",
        "hardwareDiagram": "probe_prospector",
        "interactiveComponents": [
          {
            "id": "neutron_spectrometer",
            "name": "Neutron Spectrometer (Fast & Epithermal)",
            "status": "DISCOVERED HYDROGEN AT POLES",
            "statusType": "confirmed",
            "description": "Detected significant epithermal neutron leakage deficits at lunar poles, proving high concentrations of hydrogen (water ice).",
            "silentStory": "Prompted NASA to deliberately plunge the spacecraft into Shoemaker Crater on July 31, 1999 to kick up ice vapor."
          },
          {
            "id": "shoemaker_capsule",
            "name": "Eugene Shoemaker Memorial Capsule",
            "status": "RESTING IN SHOEMAKER CRATER",
            "statusType": "confirmed",
            "description": "Carried a brass foil inscription of Romeo and Juliet and an image of Comet Hale-Bopp.",
            "silentStory": "To this day, Eugene Shoemaker remains the only human whose ashes are buried on the Moon."
          }
        ],
        "clues": [
          {
            "title": "Epithermal Neutron Absorption Dip",
            "type": "confirmed",
            "text": "Spectrometer showed hydrogen concentrations up to 1,800 ppm in cold polar shadow traps."
          },
          {
            "title": "Low Angle of Impact: 6.3 Degrees",
            "type": "confirmed",
            "text": "The spacecraft struck at a shallow 6.3-degree angle, trapping the debris plume below the crater rim."
          },
          {
            "title": "Earth Telescopes Plume Absence",
            "type": "confirmed",
            "text": "Hubble and Keck telescopes failed to detect optical water emissions because the impact lacked sufficient kinetic energy."
          }
        ],
        "miniGame": {
          "type": "spectrometer_hunter",
          "instruction": "EPITHERMAL NEUTRON SWEEP: Calibrate the epithermal neutron sensor to isolate hydrogen absorption dips in permanently shadowed polar craters!"
        },
        "hypotheses": [
          {
            "id": "h1",
            "text": "The spacecraft was deliberately crashed into a polar crater to excavate water ice, but its shallow 6.3° impact angle trapped the faint plume below the high crater rim.",
            "correct": true,
            "explanation": "CONFIRMED: The impact successfully targeted Shoemaker crater, but shallow impact physics prevented the plume from rising above the rim into Earth view."
          },
          {
            "id": "h2",
            "text": "The spacecraft missed the Moon completely and entered an orbit around Mars.",
            "correct": false,
            "explanation": "INCORRECT: DSN Doppler tracking confirmed impact inside Shoemaker crater right on schedule."
          }
        ],
        "historicalDebrief": {
          "whatInvestigatorsProved": "Confirmed that hydrogen is concentrated in both the northern and southern polar craters of the Moon.",
          "whatRemainsSuspected": "Whether the hydrogen is purely cometary water ice or solar-wind implanted protons.",
          "engineeringLegacy": "Directly led to the LCROSS mission, which used a much heavier 2-ton spent rocket impactor at a steep 84° angle to ensure plume visibility.",
          "openQuestion": "What is the isotopic deuterium-to-hydrogen (D/H) ratio of lunar polar ice compared to Earth's oceans?"
        }
      },
      {
        "id": "moon_07_apollo12",
        "level": 3,
        "missionNumber": 7,
        "globalLevel": 19,
        "tier": "middle",
        "destination": "moon",
        "codename": "Apollo 12",
        "title": "Apollo 12: Struck by Lightning & 'Try SCE to AUX'",
        "target": "Saturn V Launch & Moon Ocean of Storms",
        "dateRange": "November 1969",
        "mystery": "36 seconds after launch in a thunderstorm, lightning struck the Saturn V rocket twice, wiping out all power and scrambling telemetry. How did 4 words save the mission?",
        "endingType": "Lightning Strike Telemetry Rescue",
        "badge": "APOLLO-12-SCE-ANALYST",
        "badgeIcon": "⚡",
        "hardwareDiagram": "apollo_saturn",
        "interactiveComponents": [
          {
            "id": "sce_switch",
            "name": "Signal Conditioning Equipment (SCE)",
            "status": "VOLTAGE TRANSIENT OVERLOAD",
            "statusType": "confirmed",
            "description": "Lightning ionized the exhaust plume, shorting the AC buses and knocking the SCE into low-voltage lockup.",
            "silentStory": "24-year-old Flight Controller John Aaron recognized the scrambled patterns from a test simulation and made the call: 'Try SCE to AUX!'"
          },
          {
            "id": "saturn_instrument_unit",
            "name": "Saturn V Instrument Unit (IU)",
            "status": "HELD FLIGHT ATTITUDE THROUGH LIGHTNING",
            "statusType": "confirmed",
            "description": "The Saturn V rocket's own separate computer held the course smoothly while the crew's cockpit panels went completely black.",
            "silentStory": "Astronaut Alan Bean flipped the tiny SCE switch; cockpit gauges flashed back to life and the mission was saved."
          }
        ],
        "clues": [
          {
            "title": "Static Discharge Ionized Plume",
            "type": "confirmed",
            "text": "The ascending rocket created an artificial lightning conductor between low clouds and the ground."
          },
          {
            "title": "AC Inverters Offline Telemetry",
            "type": "confirmed",
            "text": "Master alarms sounded and all three fuel cells disconnected from the main bus simultaneously."
          },
          {
            "title": "John Aaron's Legendary Call",
            "type": "confirmed",
            "text": "Switching the Signal Conditioning Equipment to Auxiliary restored analog sensor voltages instantly."
          }
        ],
        "miniGame": {
          "type": "circuit_patch",
          "instruction": "LIGHTNING STRIKE BUS JUMPER: 'Flight, try SCE to AUX' - reconnect essential power bus and auxiliary signal conditioning electronics after twin lightning strikes!"
        },
        "hypotheses": [
          {
            "id": "h1",
            "text": "Lightning struck the rocket plume and scrambled telemetry; switching the Signal Conditioning Equipment (SCE) to Auxiliary restored electrical sensor power and saved the Moon flight.",
            "correct": true,
            "explanation": "CONFIRMED: John Aaron's immortal call 'Try SCE to AUX' restored telemetry, allowing the crew to re-enable fuel cells and land at Ocean of Storms."
          },
          {
            "id": "h2",
            "text": "The Saturn V rocket's first stage exploded, forcing an emergency abort tower separation.",
            "correct": false,
            "explanation": "INCORRECT: The Saturn V first stage burned flawlessly and placed the spacecraft in orbit."
          }
        ],
        "historicalDebrief": {
          "whatInvestigatorsProved": "Confirmed that ascending space vehicles can trigger lightning strikes through their ionized exhaust plumes even in mild clouds.",
          "whatRemainsSuspected": "Whether the Command Module parachute pyrotechnic switches were close to triggering during the electrical discharge.",
          "engineeringLegacy": "NASA established strict launch weather commit criteria forbidding launches through charged cloud layers.",
          "openQuestion": "How do commercial carbon-composite rockets dissipate static charge without heavy copper mesh grounding strips?"
        }
      },
      {
        "id": "moon_08_ranger7",
        "level": 4,
        "missionNumber": 8,
        "globalLevel": 20,
        "tier": "middle",
        "destination": "moon",
        "codename": "Ranger 7",
        "title": "Ranger 7: The First Photos Before High-Speed Impact",
        "target": "Moon - Mare Cognitum",
        "dateRange": "July 1964",
        "mystery": "Rangers 1 through 6 failed—missed the Moon, died in orbit, or had dead cameras. With Congress threatening cancellation, how did Ranger 7 capture 4,308 pictures in its final 17 minutes?",
        "endingType": "Successful High-Speed Impact Crash",
        "badge": "RANGER-7-IMPACT-ANALYST",
        "badgeIcon": "📸",
        "hardwareDiagram": "probe_ranger",
        "interactiveComponents": [
          {
            "id": "vidicon_camera_cluster",
            "name": "Six Vidicon TV Cameras (F & P Channels)",
            "status": "4,308 PICTURES IN 17 MINUTES",
            "statusType": "confirmed",
            "description": "Cameras warmed up at 2,000 km altitude, snapping pictures of increasing resolution down to 0.5 meters until ground impact.",
            "silentStory": "The final picture was transmitted with half of the image scanned when the spacecraft crashed into the lunar dust at 5,900 mph."
          },
          {
            "id": "high_gain_antenna",
            "name": "High-Gain Parabolic Reflector",
            "status": "COMMUNICATION NOMINAL UNTIL IMPACT",
            "statusType": "confirmed",
            "description": "Broadcasted television signals live to Goldstone DSN, proving the Moon's surface was smooth enough for Apollo landing gear.",
            "silentStory": "The crash site was officially named 'Mare Cognitum'—The Sea That Has Become Known."
          }
        ],
        "clues": [
          {
            "title": "Six Consecutive Previous Failures",
            "type": "confirmed",
            "text": "Rangers 1 to 6 all suffered premature launch, guidance, or camera power inverter failures."
          },
          {
            "title": "Sub-Meter Resolution Reveal",
            "type": "confirmed",
            "text": "Images showed that lunar plains were covered in small impact craters but lacked impenetrable dust swamps."
          },
          {
            "title": "Final Partial Scan Frame",
            "type": "confirmed",
            "text": "Telemetry cut off midway through the final frame as the spacecraft impacted at 2.6 km/s."
          }
        ],
        "miniGame": {
          "type": "radio_tuner",
          "instruction": "HIGH-RESOLUTION TV CARRIER LOCK: Tune carrier frequency and phase offset on the CRT oscilloscope to lock onto the vidicon TV downlink before impact!"
        },
        "hypotheses": [
          {
            "id": "h1",
            "text": "Ranger 7 succeeded after 6 consecutive mission failures, transmitting 4,308 high-resolution photos in its final 17 minutes before smashing into the Moon at 5,900 mph.",
            "correct": true,
            "explanation": "CONFIRMED: Ranger 7 provided humanity's first close-up view of the lunar surface, proving the regolith could safely support the Apollo Lunar Module."
          },
          {
            "id": "h2",
            "text": "Ranger 7 bounced off the lunar surface due to an inflatable rubber airbag cushion.",
            "correct": false,
            "explanation": "INCORRECT: Ranger was a hard-impact ballistic probe designed to be destroyed upon impact."
          }
        ],
        "historicalDebrief": {
          "whatInvestigatorsProved": "Proved that the lunar surface was not covered in a deep sea of quicksand dust as some astrophysicists had feared.",
          "whatRemainsSuspected": "The exact crater excavated by Ranger 7's 362-kg kinetic impact in Mare Cognitum.",
          "engineeringLegacy": "Established rigorous component reliability and burn-in testing standards at the Jet Propulsion Laboratory.",
          "openQuestion": "How quickly do micro-meteorite impacts erode fresh spacecraft impact craters on the airless lunar surface?"
        }
      }
    ],
    "advanced": [
      {
        "id": "moon_09_lunar_orbiter1",
        "level": 1,
        "missionNumber": 9,
        "globalLevel": 21,
        "tier": "advanced",
        "destination": "moon",
        "codename": "Lunar Orbiter 1",
        "title": "Lunar Orbiter 1: The 'Earthrise' Photo & Controlled Far Side Crash",
        "target": "Moon - Lunar Far Side Controlled Impact",
        "dateRange": "1966",
        "mystery": "Why did an automated probe carry a full darkroom with photographic film and chemicals to the Moon, and why did NASA deliberately crash it into the far side?",
        "endingType": "Controlled Far Side Kinetic Impact",
        "badge": "ORBITER-1-LEAD",
        "badgeIcon": "📷",
        "hardwareDiagram": "probe_lunar_orbiter",
        "interactiveComponents": [
          {
            "id": "darkroom_processor",
            "name": "Eastman Kodak Bimat Film Processor",
            "status": "DEVELOPED 70MM FILM IN SPACE",
            "statusType": "confirmed",
            "description": "Exposed film, chemically developed it with damp Bimat webbing, and scanned it with a cathode ray tube to beam back to Earth.",
            "silentStory": "Captured the iconic first photograph of Earth rising over the lunar limb on August 23, 1966."
          },
          {
            "id": "velocity_control_engine",
            "name": "Marquardt 100-lbf Hypergolic Engine",
            "status": "CONTROLLED DEORBIT BURN",
            "statusType": "confirmed",
            "description": "NASA deliberately fired the engine on October 29, 1966 to crash the craft into the lunar far side.",
            "silentStory": "Crashed deliberately so its radio transmitter frequencies would not interfere with the upcoming Lunar Orbiter 2."
          }
        ],
        "clues": [
          {
            "title": "Wet Chemical Developing in Orbit",
            "type": "confirmed",
            "text": "Spacecraft contained a miniaturized photographic film processing laboratory using liquid developer."
          },
          {
            "title": "First Earthrise Photograph",
            "type": "confirmed",
            "text": "Frame 102 showed humanity's home world as a blue-and-white crescent rising above the desolate lunar horizon."
          },
          {
            "title": "Far Side Controlled Deorbit Command",
            "type": "confirmed",
            "text": "Fired engine to impact far side coordinates 7° N, 161° E to prevent radio interference with Lunar Orbiter 2."
          }
        ],
        "miniGame": {
          "type": "orbital_slingshot",
          "instruction": "LUNAR GRAVITY INSERTION CORRIDOR: Calibrate approach angle and retro-burn Delta-V to capture the orbiter into the Apollo landing site survey inclination!"
        },
        "hypotheses": [
          {
            "id": "h1",
            "text": "After capturing the historic first Earthrise image and mapping Apollo landing sites, Lunar Orbiter 1 was deliberately crashed into the far side to clear its radio frequency for the next mission.",
            "correct": true,
            "explanation": "CONFIRMED: NASA executed a controlled deorbit into the lunar far side so its telemetry frequencies would not jam Lunar Orbiter 2."
          },
          {
            "id": "h2",
            "text": "The spacecraft crashed because radiation from the Van Allen belts melted the camera lenses.",
            "correct": false,
            "explanation": "INCORRECT: The photographic system functioned smoothly and achieved all primary mission objectives."
          }
        ],
        "historicalDebrief": {
          "whatInvestigatorsProved": "Proved that high-resolution film developed in lunar orbit could identify Apollo landing hazards down to 1 meter across.",
          "whatRemainsSuspected": "The exact debris field coordinates of Lunar Orbiter 1 on the heavily cratered far side.",
          "engineeringLegacy": "Mapped 99% of the Moon and pioneered planetary orbital deorbit protocol to avoid orbital clutter.",
          "openQuestion": "How do gravitational mass concentrations ('mascons') destabilize low-altitude lunar satellite orbits?"
        }
      },
      {
        "id": "moon_10_apollo14",
        "level": 2,
        "missionNumber": 10,
        "globalLevel": 22,
        "tier": "advanced",
        "destination": "moon",
        "codename": "Apollo 14",
        "title": "Apollo 14: The Antares Abort Bit Glitch & The 2-Hour Hack",
        "target": "Moon - Fra Mauro Highlands",
        "dateRange": "February 1971",
        "mystery": "Hours before landing, a loose solder ball inside a switch sent a phantom 'ABORT' signal to the computer. If descent started, the engine would abort automatically! How did a programmer hack the computer in 2 hours?",
        "endingType": "In-Flight Software Patch & Successful Touchdown",
        "badge": "APOLLO-14-HACK-LEAD",
        "badgeIcon": "💻",
        "hardwareDiagram": "apollo_lm",
        "interactiveComponents": [
          {
            "id": "abort_switch",
            "name": "Master Abort Pushbutton Switch",
            "status": "LOOSE SOLDER BALL SHORT CIRCUIT",
            "statusType": "confirmed",
            "description": "A microscopic speck of solder shook loose inside the switch, bridging contacts and setting the computer's 'ABORT' register to 1.",
            "silentStory": "If the descent propulsion engine fired, the guidance software would instantly interpret the bit as a command to abort and jettison the descent stage!"
          },
          {
            "id": "apollo_guidance_computer",
            "name": "AGC Memory Bank Register 1013",
            "status": "REMOTELY REPROGRAMMED IN 2 HOURS",
            "statusType": "confirmed",
            "description": "MIT programmer Don Eyles wrote an ingenious in-flight memory patch to make the computer ignore the hardwired abort bit.",
            "silentStory": "Astronaut Ed Mitchell hand-typed the hex memory instructions on the DSKY keypad just minutes before descent began."
          }
        ],
        "clues": [
          {
            "title": "Intermittent Abort Bit Telemetry Flag",
            "type": "confirmed",
            "text": "Computer bit 1013 flashed true whenever astronauts tapped the instrument panel."
          },
          {
            "title": "Don Eyles MIT Emergency Software Hack",
            "type": "confirmed",
            "text": "Programmer Don Eyles created a routine forcing the computer to believe an abort was already in progress so it would ignore the switch."
          },
          {
            "title": "Manual Throttle Overwrite Sequence",
            "type": "confirmed",
            "text": "Mitchell punched in 61 separate keystrokes into the DSKY computer terminal while orbiting the Moon."
          }
        ],
        "miniGame": {
          "type": "memory_decrypt",
          "instruction": "MIT AGC ABORT BIT BYPASS: Patch the computer's core rope memory registers to lock out false abort button contact closures before descent ignition!"
        },
        "hypotheses": [
          {
            "id": "h1",
            "text": "A loose solder ball inside the abort switch created a phantom abort signal; MIT programmer Don Eyles coded a remote patch in 2 hours that tricked the computer into ignoring the switch.",
            "correct": true,
            "explanation": "CONFIRMED: This celebrated hack bypassed the shorted abort switch, allowing Alan Shepard and Ed Mitchell to land safely at Fra Mauro."
          },
          {
            "id": "h2",
            "text": "The lunar lander ran out of fuel and made an emergency landing on an active lunar volcano.",
            "correct": false,
            "explanation": "INCORRECT: Antares touched down smoothly with ample fuel reserves; the Moon has had no active volcanoes for billions of years."
          }
        ],
        "historicalDebrief": {
          "whatInvestigatorsProved": "Proved that mechanical switch contamination by loose conductive solder debris can paralyze spacecraft avionics.",
          "whatRemainsSuspected": "Whether the solder ball could have vibrated free during the descent engine burn.",
          "engineeringLegacy": "Mandated hermetically sealed microswitches with particulate-free manufacturing standards for all manned spacecraft.",
          "openQuestion": "How will future deep-space exploration software dynamically reconfigure itself to bypass hardware faults without ground support?"
        }
      },
      {
        "id": "moon_11_ladee",
        "level": 3,
        "missionNumber": 11,
        "globalLevel": 23,
        "tier": "advanced",
        "destination": "moon",
        "codename": "LADEE",
        "title": "LADEE: The Levitating Lunar Dust Exosphere & Deorbit",
        "target": "Moon - Low Lunar Orbit & Far Side Impact",
        "dateRange": "2013 - 2014",
        "mystery": "Apollo astronauts sketched strange glowing rays above the lunar sunrise. 40 years later, how did LADEE prove dust levitates above the Moon, and why did it crash at 3,600 mph?",
        "endingType": "Controlled High-Speed Far Side Impact",
        "badge": "LADEE-EXOSPHERE-LEAD",
        "badgeIcon": "✨",
        "hardwareDiagram": "probe_ladee",
        "interactiveComponents": [
          {
            "id": "lunar_dust_experiment",
            "name": "LDEX Lunar Dust Experiment",
            "status": "MEASURED ELECTROSTATIC DUST LEVITATION",
            "statusType": "confirmed",
            "description": "Detected a tenuous, lofted dust cloud surrounding the Moon created by solar ultraviolet charging and micrometeoroid impacts.",
            "silentStory": "Confirmed that Apollo astronauts' sketches of 'horizon glow' were caused by electrostatic dust levitating miles high."
          },
          {
            "id": "optical_laser_terminal",
            "name": "LLCD Pulsed Laser Communications",
            "status": "BROKE DEEP SPACE SPEED RECORD",
            "statusType": "confirmed",
            "description": "Transmitted data from lunar orbit to Earth via pulsed laser beams at an unprecedented 622 Megabits per second.",
            "silentStory": "On April 18, 2014, with propellant exhausted, LADEE made a planned high-speed impact on the eastern rim of Sundman V crater."
          }
        ],
        "clues": [
          {
            "title": "Apollo Horizon Glow Mystery",
            "type": "confirmed",
            "text": "Apollo 8, 10, and 17 astronauts sketched luminous streamers above the dark lunar limb prior to sunrise."
          },
          {
            "title": "Electrostatic Micron Dust Detection",
            "type": "confirmed",
            "text": "LDEX sensor recorded sub-micron dust grain impacts increasing during meteoroid stream crossings."
          },
          {
            "title": "Sundman V Crater Impact Scar",
            "type": "confirmed",
            "text": "LRO camera imaged the fresh 3-meter impact crater carved by LADEE's terminal plunge."
          }
        ],
        "miniGame": {
          "type": "radio_tuner",
          "instruction": "LUNAR EXOSPHERE OPTICAL RF SYNC: Align laser and radio carrier frequency on the CRT oscilloscope to lock onto lunar exosphere dust telemetry!"
        },
        "hypotheses": [
          {
            "id": "h1",
            "text": "LADEE proved that ultraviolet solar radiation electrostatically charges the lunar surface, levitating dust grains into an exosphere glow before ending its mission in a planned far side impact.",
            "correct": true,
            "explanation": "CONFIRMED: LADEE confirmed the existence of the lunar dust cloud and proved the viability of deep-space laser communications before deorbiting."
          },
          {
            "id": "h2",
            "text": "The spacecraft was shot down by a rogue satellite in Earth orbit.",
            "correct": false,
            "explanation": "INCORRECT: LADEE was in lunar orbit 384,000 km from Earth; its impact was planned and controlled by NASA Ames."
          }
        ],
        "historicalDebrief": {
          "whatInvestigatorsProved": "Proved that the Moon is enveloped in a permanent but variable asymmetric cloud of levitating dust particles.",
          "whatRemainsSuspected": "The exact electrical charge potential of lunar regolith in polar shadows during solar particle events.",
          "engineeringLegacy": "Proved deep-space laser communications (LLCD) can replace traditional RF links with 10x higher bandwidth for Mars missions.",
          "openQuestion": "How will electrostatic lunar dust affect the seals, bearings, and solar arrays of permanent Artemis surface habitats?"
        }
      },
      {
        "id": "moon_12_clementine",
        "level": 4,
        "missionNumber": 12,
        "globalLevel": 24,
        "tier": "advanced",
        "destination": "moon",
        "codename": "Clementine (DSPSE)",
        "title": "Clementine: Bistatic Polar Ice Radar & Thruster Runaway",
        "target": "Moon - South Pole & Near-Earth Asteroid Geographos",
        "dateRange": "1994",
        "mystery": "Clementine made the first radar discovery of ice in the dark craters of the Moon in 1994. But why did an onboard computer glitch spin the spacecraft up to 80 RPM and dump all its fuel?",
        "endingType": "Thruster Runaway & Fuel Exhaustion",
        "badge": "CLEMENTINE-ICE-LEAD",
        "badgeIcon": "🔬",
        "hardwareDiagram": "probe_clementine",
        "interactiveComponents": [
          {
            "id": "bistatic_radar_rf",
            "name": "Bistatic S-Band Radar System",
            "status": "DETECTED LUNAR POLAR ICE (1994)",
            "statusType": "confirmed",
            "description": "Beamed radio signals into dark south polar craters; circular polarization ratio of reflected signals matched water ice.",
            "silentStory": "The groundbreaking discovery that revived world interest in lunar exploration and led directly to Lunar Prospector, LCROSS, and Artemis."
          },
          {
            "id": "rcs_thruster_valve",
            "name": "Attitude Control Thruster Cluster",
            "status": "COMPUTER LOCKUP & 11-MINUTE RUNAWAY",
            "statusType": "confirmed",
            "description": "In May 1994, a software exception froze the computer with thruster valves wide open, venting all propellant and spinning the craft to 80 RPM.",
            "silentStory": "The fuel depletion prevented Clementine from visiting asteroid Geographos, leaving it stranded in Earth-Moon orbit."
          }
        ],
        "clues": [
          {
            "title": "Circular Polarization Ratio (CPR > 1)",
            "type": "confirmed",
            "text": "Reflected radio waves from permanently shadowed craters exhibited high CPR signatures characteristic of water ice."
          },
          {
            "title": "Avionics Software Hardware Lockup",
            "type": "confirmed",
            "text": "A computer exception handler failed to shut off the attitude control thruster valves."
          },
          {
            "title": "80 RPM Spin & Total Propellant Loss",
            "type": "confirmed",
            "text": "Thrusters fired continuously for 11 minutes until propellant was depleted, preventing asteroid rendezvous."
          }
        ],
        "miniGame": {
          "type": "memory_decrypt",
          "instruction": "RUNAWAY THRUSTER HEX PATCH: Overwrite corrupted RAM registers to shut down stuck attitude solenoid valves before the propellant tanks deplete to 0%!"
        },
        "hypotheses": [
          {
            "id": "h1",
            "text": "Clementine discovered the first evidence of lunar polar water ice using bistatic radar, but a computer freeze locked attitude thruster valves open, dumping all propellant and spinning the ship.",
            "correct": true,
            "explanation": "CONFIRMED: Clementine revolutionized lunar science with the first ice detection, but a software deadlock fired thrusters for 11 minutes, canceling the asteroid flyby."
          },
          {
            "id": "h2",
            "text": "The spacecraft collided with an uncharted lunar mountain.",
            "correct": false,
            "explanation": "INCORRECT: Clementine safely orbited the Moon for 2 months and mapped 99% of the lunar surface in 11 spectral bands."
          }
        ],
        "historicalDebrief": {
          "whatInvestigatorsProved": "Confirmed that permanently shadowed craters at the lunar south pole reflect circular polarized radar consistent with volatile water ice.",
          "whatRemainsSuspected": "Whether the radar reflections were pure water ice or extremely rough rocky crater block ejecta.",
          "engineeringLegacy": "Demonstrated lightweight military sensor technology for civilian space exploration, but emphasized watchdog timer failsafes for all pyrotechnic and thruster valves.",
          "openQuestion": "What is the true volumetric purity of water ice deposits across the south polar ridge of Shackleton crater?"
        }
      }
    ]
  }
};
