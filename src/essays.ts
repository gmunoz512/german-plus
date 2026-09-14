export type Essay = {
  id: string
  title: string
  date: string
  paragraphs: string[]
}

export const essays: Essay[] = [
  {
    id: 'is-it-worth-building',
    title: 'is it worth building?',
    date: 'sep 14, 2026',
    paragraphs: [
      "i ask myself this every day, ha! let's think this through together though.",
      "most innovations probably start without a roadmap. that doesn't mean you should.",
      "before you build anything, put your research cap on. there is a real chance someone has already solved your problem, and if they have, that's a good thing. go use it. if it meets your needs, great. if it doesn't exist yet, then you have your answer. buckle in.",
      "what i've learned about myself through all of this is that i enjoy learning something new more than i enjoy building something new. those aren't the same thing, and it's worth knowing which one drives you, because they lead to very different paths. some people are builders. they get energy from seeing something exist that didn't before. i get energy from the moment right before that, when something that was confusing starts to make sense. the click. that's what i'm chasing. it's not absolute either, you can enjoy both, but there should be one that outweighs the other.",
      "if you're having trouble figuring that out, try building something. it could be anything. a site for an upcoming family trip with an itinerary, or a hike with your friends showing alternative routes and safety tips. once you find your formula, once you figure out what works, gauge yourself. determine whether your next build is simply an iteration of what came before, wrapping the same vehicle in a different color, or whether you find yourself drawn toward territory that is completely different from where you started. that distinction will tell you whether there is more value in refining what you know or in starting from zero.",
      "i don't think there's a universal answer. but i think you have to be honest about which one you're actually doing and why. because there's a version of productivity that is really just comfort wearing a disguise. you build fast, you feel good, and nothing about you actually changes. that's not a bad life, probably the best for your mental health, lol. but it's not growth either.",
      "for me, the harder question isn't whether to build. it's whether what i'm building is still teaching me something. the remarkable thing about this era is that everything is evolving at an unprecedented speed, and if you're not learning something new, it's probably because you're not seeking it. that's the real answer to whether it's worth building. not what you make, but whether you're still curious enough to start.",
    ],
  },
]
