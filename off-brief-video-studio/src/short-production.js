/**
 * OFF BRIEF active short-format production.
 * Season 1 uses three approved shots per episode. Season 2 remains on hold.
 * The original long scripts remain archived in canonical-production.js.
 */
const shot = (frameId, title, camera, action, motion, beat, duration, dialogue) => ({
  frameId,
  originalScene: Number(frameId.slice(-1)),
  title,
  cast: ['Nia', 'Ruby'],
  camera,
  action,
  motion,
  dialogueCue: '',
  location: 'OFF BRIEF creative studio',
  scene: Number(frameId.slice(-1)),
  beat,
  plannedStart: 0,
  plannedEnd: duration,
  plannedDuration: duration,
  dialogue
});

const line = (character, text, id) => ({ character, text, id });

export const SHORT_EPISODES = [
  {
    season: 1,
    episode: 1,
    title: 'The Viral Emergency',
    lesson: 'A clear visual joke needs one setup, one mistake and one payoff.',
    question: 'Would you keep the fog shot?',
    status: 'active',
    scenes: [
      shot('E01-S01', 'A little steam', 'Locked medium-wide product setup',
        'Nia frames a clean coffee product shot while Ruby holds a white reflector beside the table. One coffee cup is centered and the set is calm.',
        'Nia makes one precise camera adjustment. Ruby holds the reflector steady. Natural blinking and restrained acting.',
        'SETUP', 5, [line('Nia', 'Just a little steam, Ruby.', 'nia')]),
      shot('E01-S02', 'Cinematic fog', 'Locked medium-wide reaction shot',
        'Ruby switches on a small fog machine. Thick white fog spreads across the coffee table while Nia slowly turns toward Ruby.',
        'Fog expands naturally. Ruby looks delighted. Nia gives one controlled, disbelieving reaction.',
        'MISTAKE', 5, [line('Ruby', 'You said cinematic.', 'ruby')]),
      shot('E01-S03', 'It worked', 'Locked medium shot with product foreground',
        'The fog clears enough to reveal the coffee cup perfectly illuminated. Nia checks the camera screen while Ruby waits proudly.',
        'Fog dissipates. Nia checks the screen, pauses and gives Ruby a reluctant impressed look.',
        'PAYOFF', 5, [line('Nia', 'I hate that it worked.', 'nia')])
    ]
  },
  {
    season: 1,
    episode: 2,
    title: 'The Client Said Beige',
    lesson: 'A small client note should not erase the brand.',
    question: 'How much beige is too much?',
    status: 'active',
    scenes: [
      shot('E02-S01', 'One touch of beige', 'Locked medium two-shot',
        'Nia reads a short client note from her tablet while Ruby listens beside a neutral color card.',
        'Nia raises the tablet slightly. Ruby leans in to listen.',
        'SETUP', 5, [line('Nia', 'They want one touch of beige.', 'nia')]),
      shot('E02-S02', 'The beige experience', 'Locked wide reveal',
        'Ruby pulls away a cover to reveal the studio fully dressed in beige fabric, beige props and a beige coffee mug.',
        'Ruby reveals the set with proud theatrical timing. Nia stays completely still.',
        'MISTAKE', 7, [line('Ruby', 'I gave them a beige experience.', 'ruby')]),
      shot('E02-S03', 'Find the blazer', 'Locked medium reaction',
        'Nia stands against the beige backdrop, nearly blending into it except for her royal-blue blazer. Ruby studies the result.',
        'Nia looks down at the matching set and then back to Ruby with dry restraint.',
        'PAYOFF', 7, [line('Nia', 'At least they can still find me.', 'nia')])
    ]
  },
  {
    season: 1,
    episode: 3,
    title: 'Influencer for a Day',
    lesson: 'The most natural take is often the unplanned one.',
    question: 'Would you post the accident?',
    status: 'active',
    scenes: [
      shot('E03-S01', 'Natural and effortless', 'Locked medium creator shot',
        'Ruby poses with a product bottle in front of a ring light while Nia watches the recording monitor.',
        'Ruby settles into a polished pose. Nia checks framing without moving the camera.',
        'SETUP', 5, [line('Ruby', 'Natural and effortless.', 'ruby')]),
      shot('E03-S02', 'The accidental take', 'Locked medium action shot',
        'The ring light tilts. Ruby loses her pose and Nia catches the product bottle before it falls.',
        'One controlled tilt, one quick catch and one embarrassed reaction. Preserve believable hands.',
        'MISTAKE', 7, [line('Nia', 'Very effortless.', 'nia')]),
      shot('E03-S03', 'That is the one', 'Locked close two-shot',
        'Ruby and Nia review the accidental recording on the monitor. Ruby smiles when she sees the honest moment.',
        'Ruby points once at the monitor. Nia gives a reluctant nod.',
        'PAYOFF', 6, [line('Ruby', "That's the one.", 'ruby')])
    ]
  },
  {
    season: 1,
    episode: 4,
    title: 'The AI Intern',
    lesson: 'Automation still needs direction.',
    question: 'Would you keep the AI intern?',
    status: 'active',
    scenes: [
      shot('E04-S01', 'It organizes everything', 'Locked medium desk shot',
        'Ruby shows Nia a simple AI assistant running on the laptop in their studio.',
        'Ruby turns the laptop slightly toward Nia. Nia reads the screen.',
        'SETUP', 6, [line('Ruby', 'It organizes everything.', 'ruby')]),
      shot('E04-S02', 'Four a.m. lunch', 'Locked medium-wide desk reaction',
        'The printer rapidly releases labels while reminder cards fill the laptop screen. Nia points to an incorrect schedule.',
        'Paper advances in a controlled stream. Nia points once. Ruby looks closer.',
        'MISTAKE', 7, [line('Nia', 'Why did it schedule lunch for 4 a.m.?', 'nia')]),
      shot('E04-S03', 'It knows', 'Locked close two-shot',
        'Ruby reads the screen again and looks impressed while Nia waits for an explanation.',
        'Ruby considers the message, then gives Nia a sincere confident look.',
        'PAYOFF', 7, [line('Ruby', "It knows we're behind.", 'ruby')])
    ]
  },
  {
    season: 1,
    episode: 5,
    title: 'One Product, 100 Photos',
    lesson: 'More files do not automatically create more choices.',
    question: 'How many photos would you keep?',
    status: 'active',
    scenes: [
      shot('E05-S01', 'Three photos', 'Locked medium product setup',
        'Nia carefully places one product in the center of a clean tabletop set while Ruby holds the camera.',
        'Nia aligns the product. Ruby waits with the camera ready.',
        'SETUP', 5, [line('Nia', 'We need three photos.', 'nia')]),
      shot('E05-S02', 'Options', 'Locked wide studio shot',
        'Ruby photographs the same product rapidly from several exaggerated but safe angles while Nia watches.',
        'Ruby changes position three times with crisp editorial cuts. Keep the product fixed.',
        'MISTAKE', 6, [line('Ruby', "I'm giving us options.", 'ruby')]),
      shot('E05-S03', 'One hundred copies', 'Locked over-shoulder laptop shot',
        'The laptop displays a large contact sheet of nearly identical product photos. Nia and Ruby study it.',
        'Nia scrolls once, then stops. Ruby slowly realizes the photos match.',
        'PAYOFF', 6, [line('Nia', 'We have one hundred of the same option.', 'nia')])
    ]
  },
  {
    season: 1,
    episode: 6,
    title: 'The Competitor',
    lesson: 'A memorable idea needs its own point of view.',
    question: 'Would you use the strange idea?',
    status: 'active',
    scenes: [
      shot('E06-S01', 'Do what they are doing', 'Locked medium laptop two-shot',
        'Nia and Ruby study a polished fictional competitor campaign on the laptop.',
        'Ruby gestures lightly toward the screen. Nia keeps reading.',
        'SETUP', 6, [line('Ruby', "We should do what they're doing.", 'ruby')]),
      shot('E06-S02', 'Why remember us', 'Locked medium board reveal',
        'Nia closes the laptop and turns a blank concept board toward Ruby.',
        'Nia closes the laptop with calm precision and holds Ruby’s gaze.',
        'TURN', 7, [line('Nia', 'Then why would anyone remember us?', 'nia')]),
      shot('E06-S03', 'Unfortunately memorable', 'Locked medium reaction shot',
        'Ruby draws one bold, strange concept on the board. Nia studies it in silence.',
        'Ruby finishes one simple mark. Nia pauses, then gives a reluctant nod.',
        'PAYOFF', 7, [line('Nia', "Unfortunately, I'll remember that.", 'nia')])
    ]
  },
  {
    season: 1,
    episode: 7,
    title: 'The Biggest Pitch',
    lesson: 'A strong idea survives a technical failure.',
    question: 'Could you pitch without the screen?',
    status: 'active',
    scenes: [
      shot('E07-S01', 'Go perfectly', 'Locked wide presentation setup',
        'Nia stands ready beside the presentation screen while Ruby holds the remote.',
        'Nia straightens one concept card. Ruby raises the remote.',
        'SETUP', 6, [line('Nia', 'This has to go perfectly.', 'nia')]),
      shot('E07-S02', 'Define perfectly', 'Locked wide reaction shot',
        'Ruby presses the remote and the presentation screen goes completely black.',
        'The screen clicks off. Ruby looks at the remote, then at Nia.',
        'MISTAKE', 7, [line('Ruby', 'Define perfectly.', 'ruby')]),
      shot('E07-S03', 'No Wi-Fi needed', 'Locked medium hero shot',
        'Nia calmly holds up one printed concept card and continues the presentation while Ruby watches, relieved.',
        'Nia presents the card with steady confidence. Ruby lowers the useless remote.',
        'PAYOFF', 8, [line('Nia', "Good ideas don't need Wi-Fi.", 'nia')])
    ]
  },
  {
    season: 1,
    episode: 8,
    title: 'We Almost Quit',
    lesson: 'One meaningful response can restore momentum.',
    question: 'What message would make you continue?',
    status: 'active',
    scenes: [
      shot('E08-S01', 'Maybe it is not working', 'Locked medium-wide quiet studio shot',
        'Nia closes a storage box while Ruby sits silently beside the desk at the end of a difficult day.',
        'Nia folds one box flap. Ruby looks down, then toward Nia.',
        'SETUP', 7, [line('Ruby', "Maybe this isn't working.", 'ruby')]),
      shot('E08-S02', 'Someone started', 'Locked close laptop reaction',
        'A new client message appears on the laptop. Nia reads it aloud while Ruby listens.',
        'Nia reads the screen and her expression softens. Ruby looks up.',
        'TURN', 7, [line('Nia', 'Someone said our work made them start.', 'nia')]),
      shot('E08-S03', 'Not done', 'Locked medium two-shot',
        'Ruby removes the camera from the box and hands it back to Nia. Both return to the set.',
        'Ruby lifts the camera carefully. Nia accepts it and the two share a small determined smile.',
        'PAYOFF', 8, [line('Ruby', "Then we're not done.", 'ruby')])
    ]
  }
];

export const SHORT_CAST = ['Nia', 'Ruby'];
