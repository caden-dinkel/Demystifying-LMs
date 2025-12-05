# Token Generation: Predicting What Comes Next

Once text has been tokenized and converted into embeddings, the language model's primary task begins: predicting the next token. This is the fundamental operation that powers everything language models do, from answering questions to writing creative stories.

## How Models Generate Tokens

When generating a response, the model's goal is to predict the next most likely token ID. It does this using the combined value of the embedded numbers. The model processes the entire sequence of tokens you've provided and calculates probability scores for every token in its vocabulary.

For example, with the phrase 'The fat cat', the model might generate probabilities like these:

- 'sat': 40%
- 'on': 20%
- 'jumped': 15%
- '.': 10%
- 'slept': 8%

In reality, these probability values would be distributed across thousands or even tens of thousands of possible tokens in the model's vocabulary. The model evaluates every single token and assigns it a probability based on how likely it is to come next given the context.

## The Generation Process

The generation process follows these steps:

1. **Process the Input**: The model takes your tokenized and embedded input
2. **Calculate Probabilities**: For each token in the vocabulary, calculate how likely it is to come next
3. **Sample a Token**: Select the next token (usually from the most probable options)
4. **Add to Sequence**: Append the selected token to the input
5. **Repeat**: Use the new, longer sequence as input and repeat the process

This cycle continues until the model decides to output a special "end" token or reaches a maximum length.

## Interactive Exploration

Below, you can explore this prediction process yourself. As you type, the model will show you the most likely next tokens based on what you've entered. Notice how the predictions change with each character you add - the model is constantly re-evaluating what should come next based on the growing context!
