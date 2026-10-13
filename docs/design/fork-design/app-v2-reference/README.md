# App v2 design reference

Open the HTML files in a browser: feed, idea-page, back-sheet, idea-tree, profile, feed-mobile.
This is the approved visual target for the product screens. Match layout, spacing, colours, type and copy.

Keep every existing behaviour and data path. The screens use example data from the shared story
(mira, theo, lena, kaan; $0.040, $0.045, $0.048; 70/20/10 and 80/20 splits). In the product every value comes from the real API.

Shell: a 264px sidebar (logo, Feed, Explore, Create, Profile, network, a Claimable card with Withdraw, the wallet card)
and a sticky top bar (search, New idea, account). Content: main column plus a 320px context rail that hides below 1100px.
Below 860px the sidebar becomes the bottom tab bar shown in feed-mobile.
