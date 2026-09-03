export const CSharpCode = [
  "using System;",
  "",
  'Console.WriteLine(Greeting.Create("coettools"));',
  "",
  "public static class Greeting",
  "{",
  "    // Displayed as text, never executed.",
  "    public static string Create(string name)",
  "    {",
  '        return $"Hello, {name}!";',
  "    }",
  "}"
].join("\n");
