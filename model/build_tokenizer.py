import torch
import numpy
import tokenizers
import datasets

from datasets import load_dataset
from tokenizers import Tokenizer, normalizers
from tokenizers.models import BPE
from tokenizers.trainers import BpeTrainer
from tokenizers.normalizers import BertNormalizer, NFD
from tokenizers.pre_tokenizers import Whitespace



tokenizer = Tokenizer(BPE(unk_token="[UNK]"))
normalizer = normalizers.Sequence([BertNormalizer(clean_text=True,strip_accents=True), NFD()])
trainer = BpeTrainer(special_tokens=["[UNK]", "[CLS]", "[SEP]", "[PAD]"])
tokenizer.pre_tokenizer = Whitespace()
tokenizer.normalizer = normalizer

#Loading from online dataset
dataset = load_dataset("roneneldan/TinyStories")

def batch_iterator(dataset, batch_size=1000):
    for i in range(0, len(dataset), batch_size):
        yield dataset[i: i + batch_size]["text"]

tokenizer.train_from_iterator(batch_iterator(dataset['train']), trainer=trainer, length=len(dataset))

tokenizer.save("tokenizer-tiny.json")

