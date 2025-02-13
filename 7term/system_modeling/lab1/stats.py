from generator import RandomNumberGenerator
from constants import N_INTERVALS, CHI2_ALPHA
from scipy.stats import chi2
import numpy as np
import matplotlib.pyplot as plt


class Stats:
    def __init__(
        self, data, generator_class: RandomNumberGenerator, n_intervals: int = N_INTERVALS
    ) -> None:
        self.data = np.array(data)
        self.generator = generator_class
        self.generator_name = type(generator_class).__name__
        self.n_intervals = n_intervals

        self._mean = None
        self._variance = None
        self.bin_edges = None
        self.bins_count_before_merge = None
        self.bins_count_after_merge = None
        self.observed_freq = None
        self.expected_freq = None

    @property
    def mean(self):
        if self._mean is None:
            self._mean = np.sum(self.data) / len(self.data)
        return self._mean

    @property
    def variance(self):
        if self._variance is None:
            self._variance = np.sum([(x - self.mean) ** 2 for x in self.data]) / (
                len(self.data) - 1
            )
        return self._variance

    def chi_squared_test(self, n_params=1):
        if self.observed_freq is None or self.expected_freq is None:
            self._compute_histogram()

        chi_squared_stat = np.sum(
            (self.observed_freq - self.expected_freq) ** 2 / self.expected_freq
        )

        # Take the length of observed frequencies to account for the new number of intervals
        degrees_of_freedom = len(self.observed_freq) - 1 - n_params
        chi_squared_critical = chi2.ppf(1 - CHI2_ALPHA, degrees_of_freedom)

        return chi_squared_stat, chi_squared_critical

    def plot_histogram(self):
        if self.observed_freq is None:
            self._compute_histogram()

        plt.figure(figsize=(10, 6))

        plt.hist(
            self.bin_edges[:-1],
            self.bin_edges,
            weights=self.observed_freq,
            edgecolor="black",
            alpha=0.7,
        )

        plt.title(f"Frequency histogram of numbers generated by {self.generator_name}")
        plt.xlabel("Generated value")
        plt.ylabel("Frequency")

        chi2, chi2_critical = self.chi_squared_test()

        bins_count_str = f"Bins: {self.bins_count_before_merge} → {self.bins_count_after_merge}"
        mean_str = f"Mean: {self.mean:.12f}"
        variance_str = f"Variance: {self.variance:.12f}"
        chi2_str = f"Chi2: {chi2:.12f}"
        chi2_critical_str = f"Chi2 critical: {chi2_critical:.12f}"
        chi2_test_res = (
            "Do not reject the null hypothesis"
            if chi2 < chi2_critical
            else "Reject the null hypothesis"
        )
        plt.text(
            0.96,
            0.96,
            f"{bins_count_str}\n{mean_str}\n{variance_str}\n{chi2_str}\n{chi2_critical_str}\n{chi2_test_res}",
            verticalalignment="top",
            horizontalalignment="right",
            transform=plt.gca().transAxes,
            bbox=dict(facecolor="white", alpha=0.8),
        )

        plt.grid(True)
        plt.show()

    def _compute_histogram(self):
        self.observed_freq, self.bin_edges = np.histogram(self.data, bins=self.n_intervals)

        bin_probs = np.diff([self.generator.cdf(edge) for edge in self.bin_edges])
        self.expected_freq = bin_probs * len(self.data)

        self.bins_count_before_merge = len(self.bin_edges)
        self._merge_small_bins()

    def _merge_small_bins(self):
        min_freq = 5
        i = 0

        while i < len(self.observed_freq) - 1:
            if self.observed_freq[i] < min_freq:
                self.observed_freq[i] += self.observed_freq[i + 1]
                self.bin_edges = np.delete(self.bin_edges, i + 1)
                self.observed_freq = np.delete(self.observed_freq, i + 1)
            else:
                i += 1

        bin_probs = np.diff([self.generator.cdf(edge) for edge in self.bin_edges])
        self.expected_freq = bin_probs * len(self.data)

        self.bins_count_after_merge = len(self.bin_edges)
