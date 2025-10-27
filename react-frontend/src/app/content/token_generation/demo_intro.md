## Token Generation: Exploring Iterative Text Process

This demo lets you explore the iterative loop models use to generate text, one token at a time. You'll get to see exactly how the model's predictions change as the context grows.

### Here's how it works:

1.  Start by typing any phrase into the 'Text to Analyze' box. The model will process this input and show you a list of the most probable next tokens.
2.  Click on any token from the probability list, that token will be added to the path, and the model will immediately re-calculate a new set of predictions based on this longer, updated sentence.
3.  Explore the token tree by clicking on any of the previous tokens in the path. This instantly reverts the demo to that previous state, letting you choose a different token and branch out.

This directly shows how the cumulative embedded values, the growing context, influence every new prediction. Use the 'Restart Search Tree' button to clear the path and start a new exploration.