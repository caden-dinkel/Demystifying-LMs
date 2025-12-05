# Tokenization: Converting Words to Numbers

To first get a computer to understand our natural language, we must break the language down into a form understandable by computers. This process is called tokenization. The process of tokenization is analogous to a child learning English with phonics. First, a child might learn the root words, before moving on to conjunction and adding suffixes and/or prefixes. Much like this child learning English, the computer breaks each word into subcomponents, but instead of splitting words based on roots, suffixes, and prefixes, the words are split depending on the frequency at which chains of letters appear in the data in question.

## What is a Token?

The first step a language model takes in interpreting human language/text is breaking it down into 'tokens'. These are the model's vocabulary. For example, the classic sentence "The fat cat sat on the mat." could be tokenized into:

- 'the'
- 'fat'
- 'cat'
- 'sat'
- 'on'
- 'the'
- 'mat'
- '.'

The larger the set of tokens, the larger the model's vocabulary. Though larger isn't always better; the bigger the vocabulary, the more complex the model becomes, requiring huge amounts of computation.

## Types of Tokenization

There are a few different ways to convert text into tokens: word tokenization, character tokenization, and subword tokenization. The first is splitting text into individual words, which is what we will focus on here. The other two are for converting text into individual characters, and subword tokenization (which breaks words into smaller pieces or character sets) is what OpenAI uses for its ChatGPT models.

## From Tokens to IDs

The next step in the process is understanding how tokens are used. Once the model tokenizes the text, it will then assign an ID to it. So for our previous example, it would look like this:

- 'the' (1)
- 'fat' (2)
- 'cat' (3)
- 'sat' (4)
- 'on' (5)
- 'the' (1) - the token is already assigned an ID of 1
- 'mat' (6)
- '.' (7)

With these IDs assigned, the phrase can be represented by a sequence of numbers: `[1, 2, 3, 4, 5, 1, 6, 7]`. This sequence is the actual input the model receives. It's important to understand that this entire vocabulary of token-ID pairs is fixed before training begins. The purpose of training is not to add new words to the list, but to learn the meaning of each existing token-ID pair.

## Embeddings: Giving Numbers Meaning

The token-ID pairs don't have any true meaning or value themselves. For example, the pair 'mat' (6) isn't twice the value of 'cat' (3). In order to derive meaning, the model converts each token ID into a complex string of numbers, called an **embedding**. This long list of numbers contains the token's relationship with other words based on the learned context. For example, the embedding for 'cat' would be closer to 'pet' than it would be to 'brick'.

Below you can see how this tokenization process works in practice. Try typing different sentences and see how the model breaks them down!
