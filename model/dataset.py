#Contains implementation of Dataset class for Pytorch
import torch
from torch.utils.data import Dataset
from torchvision import datasets
from torchvision.transforms import ToTensor
import os
import pandas as pd


class TextDataset(Dataset):
    def __init__(self, token_data, sequence_length):
        self.data = token_data
        self.seq_len = sequence_length
        if not isinstance(self.data, torch.Tensor):
            self.data = torch.tensor(self.data, dtype=torch.long)

    def __len__(self):
        return len(self.data) - self.seq_len
    
    def __getitem__(self, idx):
        inputs = self.data[idx : idx + self.seq_len]
        targets = self.data[idx + 1 : idx + self.seq_len + 1]
        return inputs, targets