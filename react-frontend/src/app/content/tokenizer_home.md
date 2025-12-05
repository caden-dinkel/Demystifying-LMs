# From Words to Numbers: How Language Models Really Work

When using Large Language Models (LLM) like OpenAI's ChatGPT, it's easy to think that they understand language just like we do. However, this is very much not true. Language models actually convert all of our input text into numbers! This may seem like a weird idea, but it's an incredibly important part of how LLMs work. Let me explain why they do it.

To start, when you read the word 'cat', you probably just thought about a small, furry animal that loves to push things off countertops. You as a person have a strong mental image of what the word means. Now, think of what an AI model does when it sees the word. AI models have no mental image, no "grounding," to understand what 'cat' means. So instead, they compare it to other words like 'meow', 'furry', and 'pet'. Since computers at their base are all 1s and 0s, so they need to convert words into numbers. This is the core reason for the entire 'tokenization' process that language models use.

## What is a Token?

The first step a language model takes in interpreting human language/text is breaking it down into 'tokens'. These are the model's vocabulary. For example, the classic sentence "The fat cat sat on the mat." could be tokenized into:

* 'the'
* 'fat'
* 'cat'
* 'sat'
* 'on'
* 'the'
* 'mat'
* '.'

The larger the set of tokens, the larger the model's vocabulary. Though larger isn't always better; the bigger the vocabulary, the more complex the model becomes, requiring huge amounts of computation.

## Types of Tokenization

There are a few different ways to convert text into tokens: word tokenization, character tokenization, and subword tokenization. The first is splitting text into individual words, which is what we will focus on here. The other two are for converting text into individual characters, and subword tokenization (which breaks words into smaller pieces or character sets) is what OpenAI uses for its ChatGPT models.

## From Tokens to IDs

The next step in the process is understanding how tokens are used. Once the model tokenizes the text, it will then assign an ID to it. So for our previous example, it would look like this:

* 'the' (1)
* 'fat' (2)
* 'cat' (3)
* 'sat' (4)
* 'on' (5)
* 'the' (1) - the token is already assigned an ID of 1
* 'mat' (6)
* '.' (7)

With these IDs assigned, the phrase can be represented by a sequence of numbers: `[1, 2, 3, 4, 5, 1, 6, 7]`. This sequence is the actual input the model receives. It's important to understand that this entire vocabulary of token-ID pairs is fixed before training begins. The purpose of training is not to add new words to the list, but to learn the meaning of each existing token-ID pair, which leads to the next step: converting these arbitrary values into something the model can actually use.

## Embeddings: Giving Numbers Meaning

The token-ID pairs don't have any true meaning or value themselves. For example, the pair 'mat' (6) isn't twice the value of 'cat' (3). In order to derive meaning, the model converts each token ID into a complex string of numbers, called an **embedding**. This long list of numbers contains the token's relationship with other words based on the learned context. For example, the embedding for 'cat' would be closer to 'pet' than it would be to 'brick'.

## Prediction: What Comes Next?

When generating a response, the model's goal is to predict the next most likely token ID. It does this using the combined value of the embedded numbers. With this new processed value, the model predicts the probability for every token in its vocabulary. For example, with the phrase 'The fat cat', the model could generate some of these probabilities:

* 'ID 4' (sat): 40%
* 'ID 5' (on): 20%
* 'ID 7' (.): 10%

In reality, these values would be extremely small due to the size of the model's vocabulary. And remember, the model does this for every additional word it adds to the final response.

## A Simple Analogy: The Chef

While this process is complex, we can think of it like being a chef.

1.  **Ingredients:** The user's text is your list of ingredients.
2.  **Tokenization:** To prep the ingredients, you dice them up.
3.  **Embeddings:** You don't blindly use ingredients; you look up the flavor profile of each one. This brings similar flavors together, similar to how certain words go together.
4.  **The Complex Math:** This is the actual cooking. The model slowly combines these flavor profiles together to create a delicious and complete meal. This requires not just mixing them together but understanding how they interact together.
5.  **Prediction:** After tasting the current combination, you decide to add the perfect next ingredient, reviewing your entire list of ingredients and picking the one most likely to fit the flavor profile.
6.  **Generation:** Once the next ingredient is picked, it's added to the pot. This process repeats until the complete meal is ready to serve.