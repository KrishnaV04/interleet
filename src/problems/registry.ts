import type { ComponentType } from "react";

export interface Problem {
  id: number;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  hasVisualization: boolean;
}

export interface ProblemVisualization {
  component: ComponentType;
  markdown: string;
}

export const problems: Problem[] = [
  { id: 1, title: "Two Sum", difficulty: "Easy", hasVisualization: true },
  { id: 2, title: "Add Two Numbers", difficulty: "Medium", hasVisualization: false },
  { id: 3, title: "Longest Substring Without Repeating Characters", difficulty: "Medium", hasVisualization: true },
  { id: 4, title: "Median of Two Sorted Arrays", difficulty: "Hard", hasVisualization: false },
  { id: 5, title: "Longest Palindromic Substring", difficulty: "Medium", hasVisualization: true },
  { id: 6, title: "Zigzag Conversion", difficulty: "Medium", hasVisualization: false },
  { id: 7, title: "Reverse Integer", difficulty: "Medium", hasVisualization: false },
  { id: 8, title: "String to Integer (atoi)", difficulty: "Medium", hasVisualization: false },
  { id: 9, title: "Palindrome Number", difficulty: "Easy", hasVisualization: true },
  { id: 10, title: "Regular Expression Matching", difficulty: "Hard", hasVisualization: false },
  { id: 11, title: "Container With Most Water", difficulty: "Medium", hasVisualization: true },
  { id: 12, title: "Integer to Roman", difficulty: "Medium", hasVisualization: false },
  { id: 13, title: "Roman to Integer", difficulty: "Easy", hasVisualization: true },
  { id: 14, title: "Longest Common Prefix", difficulty: "Easy", hasVisualization: true },
  { id: 15, title: "3Sum", difficulty: "Medium", hasVisualization: false },
  { id: 16, title: "3Sum Closest", difficulty: "Medium", hasVisualization: false },
  { id: 17, title: "Letter Combinations of a Phone Number", difficulty: "Medium", hasVisualization: false },
  { id: 18, title: "4Sum", difficulty: "Medium", hasVisualization: false },
  { id: 19, title: "Remove Nth Node From End of List", difficulty: "Medium", hasVisualization: false },
  { id: 20, title: "Valid Parentheses", difficulty: "Easy", hasVisualization: true },
  { id: 21, title: "Merge Two Sorted Lists", difficulty: "Easy", hasVisualization: true },
  { id: 22, title: "Generate Parentheses", difficulty: "Medium", hasVisualization: false },
  { id: 23, title: "Merge k Sorted Lists", difficulty: "Hard", hasVisualization: false },
  { id: 24, title: "Swap Nodes in Pairs", difficulty: "Medium", hasVisualization: false },
  { id: 25, title: "Reverse Nodes in k-Group", difficulty: "Hard", hasVisualization: false },
  { id: 26, title: "Remove Duplicates from Sorted Array", difficulty: "Easy", hasVisualization: true },
  { id: 27, title: "Remove Element", difficulty: "Easy", hasVisualization: true },
  { id: 28, title: "Find the Index of the First Occurrence in a String", difficulty: "Easy", hasVisualization: true },
  { id: 29, title: "Divide Two Integers", difficulty: "Medium", hasVisualization: false },
  { id: 30, title: "Substring with Concatenation of All Words", difficulty: "Hard", hasVisualization: false },
  { id: 31, title: "Next Permutation", difficulty: "Medium", hasVisualization: false },
  { id: 32, title: "Longest Valid Parentheses", difficulty: "Hard", hasVisualization: false },
  { id: 33, title: "Search in Rotated Sorted Array", difficulty: "Medium", hasVisualization: false },
  { id: 34, title: "Find First and Last Position of Element in Sorted Array", difficulty: "Medium", hasVisualization: false },
  { id: 35, title: "Search Insert Position", difficulty: "Easy", hasVisualization: true },
  { id: 36, title: "Valid Sudoku", difficulty: "Medium", hasVisualization: false },
  { id: 37, title: "Sudoku Solver", difficulty: "Hard", hasVisualization: false },
  { id: 38, title: "Count and Say", difficulty: "Medium", hasVisualization: false },
  { id: 39, title: "Combination Sum", difficulty: "Medium", hasVisualization: false },
  { id: 40, title: "Combination Sum II", difficulty: "Medium", hasVisualization: false },
  { id: 41, title: "First Missing Positive", difficulty: "Hard", hasVisualization: false },
  { id: 42, title: "Trapping Rain Water", difficulty: "Hard", hasVisualization: false },
  { id: 43, title: "Multiply Strings", difficulty: "Medium", hasVisualization: false },
  { id: 44, title: "Wildcard Matching", difficulty: "Hard", hasVisualization: false },
  { id: 45, title: "Jump Game II", difficulty: "Medium", hasVisualization: false },
  { id: 46, title: "Permutations", difficulty: "Medium", hasVisualization: false },
  { id: 47, title: "Permutations II", difficulty: "Medium", hasVisualization: false },
  { id: 48, title: "Rotate Image", difficulty: "Medium", hasVisualization: true },
  { id: 49, title: "Group Anagrams", difficulty: "Medium", hasVisualization: true },
  { id: 50, title: "Pow(x, n)", difficulty: "Medium", hasVisualization: false },
];
