import { stripWrapperTags, parseRawTabsMetadata, generateCleaningDiff } from '../utils/tabMetadata';
import {
  encodeMarkdownUrl, extractUrlFromMarkdownWrapper,
  escapeMarkdownText, redactSensitiveParams, buildMarkdownUrl,
  decodeIfDoubleEncoded, isAlreadyEncoded,
} from '../utils/markdownLinks';

// ===========================================================================
// tabMetadata.ts tests
// ===========================================================================

function testStripWrapperTags() {
  const cases = [
    {
      input: '<WebsiteContent_xeTGoF1gmXtCLxYQqDYsu>Hello World</WebsiteContent_xeTGoF1gmXtCLxYQqDYsu>',
      expected: 'Hello World',
      name: 'basic wrapper removal',
    },
    {
      input: '<WebsiteContent_abc123>Nested <b>HTML</b></WebsiteContent_abc123>',
      expected: 'Nested <b>HTML</b>',
      name: 'preserves inner HTML',
    },
    {
      input: 'No wrappers here',
      expected: 'No wrappers here',
      name: 'no-op for clean strings',
    },
    {
      input: '',
      expected: '',
      name: 'empty string',
    },
    {
      input: '<WebsiteContent_A>first</WebsiteContent_A> and <WebsiteContent_B>second</WebsiteContent_B>',
      expected: 'first and second',
      name: 'multiple wrappers in one string',
    },
    {
      input: '<WebsiteContent_xeTGoF1gmXtCLxYQqDYsu>[https://example.com](https://example.com)</WebsiteContent_xeTGoF1gmXtCLxYQqDYsu>',
      expected: '[https://example.com](https://example.com)',
      name: 'markdown link inside wrapper',
    },
    {
      // Fuzz: wrapper tag with max-length ID
      input: '<WebsiteContent_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA>content</WebsiteContent_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA>',
      expected: 'content',
      name: 'long wrapper ID',
    },
    {
      // Fuzz: malformed/incomplete wrapper (should remain)
      input: '<WebsiteContent_abc>unclosed',
      expected: 'unclosed',
      name: 'unclosed wrapper tag (fallback removal)',
    },
  ];

  let passed = 0;
  for (const c of cases) {
    const result = stripWrapperTags(c.input);
    if (result === c.expected) {
      passed++;
    } else {
      console.error(`FAIL [stripWrapperTags - ${c.name}]:\n  input: ${JSON.stringify(c.input)}\n  expected: ${JSON.stringify(c.expected)}\n  got: ${JSON.stringify(result)}`);
    }
  }
  console.log(`stripWrapperTags: ${passed}/${cases.length} passed`);
}

function testParseRawTabsMetadata() {
  const raw = `edge_all_open_tabs = [
{"pageTitle":"<WebsiteContent_xeTGoF1gmXtCLxYQqDYsu>Learners Knowledge Base | Healthcare IT</WebsiteContent_xeTGoF1gmXtCLxYQqDYsu>","pageUrl":"<WebsiteContent_xeTGoF1gmXtCLxYQqDYsu>[https://learners-hub.bolt.host/cohort-admin](https://learners-hub.bolt.host/cohort-admin)</WebsiteContent_xeTGoF1gmXtCLxYQqDYsu>","tabId":50635522,"isCurrent":true},
{"pageTitle":"<WebsiteContent_xeTGoF1gmXtCLxYQqDYsu>CompTIA A+ Objectives</WebsiteContent_xeTGoF1gmXtCLxYQqDYsu>","pageUrl":"<WebsiteContent_xeTGoF1gmXtCLxYQqDYsu>[https://comptiacdn.azureedge.net/.../comptia-a-220-1001-exam-objectives-(6-0).pdf?sfvrsn=aaa97081_2&utm_source=copilot.com](https://comptiacdn.azureedge.net/.../comptia-a-220-1001-exam-objectives-(6-0).pdf?sfvrsn=aaa97081_2&utm_source=copilot.com)</WebsiteContent_xeTGoF1gmXtCLxYQqDYsu>","tabId":50634294,"isCurrent":false}
]`;

  const result = parseRawTabsMetadata(raw);

  let passed = 0;
  const total = 5;

  if (result.length === 2) passed++;
  else console.error(`FAIL [parseRaw - count]: expected 2, got ${result.length}`);

  if (result[0].pageTitle === 'Learners Knowledge Base | Healthcare IT') passed++;
  else console.error(`FAIL [parseRaw - title0]: got ${result[0].pageTitle}`);

  if (result[0].tabId === 50635522) passed++;
  else console.error(`FAIL [parseRaw - tabId0]: got ${result[0].tabId}`);

  if (result[0].isCurrent === true) passed++;
  else console.error(`FAIL [parseRaw - isCurrent0]: got ${result[0].isCurrent}`);

  if (result[1].pageTitle === 'CompTIA A+ Objectives') passed++;
  else console.error(`FAIL [parseRaw - title1]: got ${result[1].pageTitle}`);

  console.log(`parseRawTabsMetadata: ${passed}/${total} passed`);
}

function testGenerateCleaningDiff() {
  const raw = `[{"pageTitle":"<WebsiteContent_x>Test</WebsiteContent_x>","pageUrl":"clean-url","tabId":1,"isCurrent":false}]`;
  const cleaned = parseRawTabsMetadata(raw);
  const diffs = generateCleaningDiff(raw, cleaned);

  let passed = 0;
  const total = 3;

  if (diffs.length === 2) passed++;
  else console.error(`FAIL [diff - count]: expected 2, got ${diffs.length}`);

  if (diffs[0].changed === true) passed++;
  else console.error(`FAIL [diff - title changed]: expected true`);

  if (diffs[1].changed === false) passed++;
  else console.error(`FAIL [diff - url unchanged]: expected false`);

  console.log(`generateCleaningDiff: ${passed}/${total} passed`);
}

// ===========================================================================
// markdownLinks.ts tests
// ===========================================================================

function testEncodeMarkdownUrl() {
  const cases = [
    {
      input: 'https://example.com/file-(1).pdf',
      expected: 'https://example.com/file-%281%29.pdf',
      name: 'encodes parentheses',
    },
    {
      input: 'https://example.com/normal-path',
      expected: 'https://example.com/normal-path',
      name: 'no-op for safe URLs',
    },
    {
      input: 'https://example.com/path?q=hello(world)',
      expected: 'https://example.com/path?q=hello%28world%29',
      name: 'encodes parens in query',
    },
    {
      input: '[https://example.com](https://example.com)',
      expected: 'https://example.com',
      name: 'extracts from markdown wrapper first',
    },
    {
      input: 'https://comptiacdn.azureedge.net/.../comptia-a-220-1001-exam-objectives-(6-0).pdf?sfvrsn=aaa97081_2',
      expected: 'https://comptiacdn.azureedge.net/.../comptia-a-220-1001-exam-objectives-%286-0%29.pdf?sfvrsn=aaa97081_2',
      name: 'real CompTIA URL with parens',
    },
  ];

  let passed = 0;
  for (const c of cases) {
    const result = encodeMarkdownUrl(c.input);
    if (result === c.expected) {
      passed++;
    } else {
      console.error(`FAIL [encodeMarkdownUrl - ${c.name}]:\n  input: ${JSON.stringify(c.input)}\n  expected: ${JSON.stringify(c.expected)}\n  got: ${JSON.stringify(result)}`);
    }
  }
  console.log(`encodeMarkdownUrl: ${passed}/${cases.length} passed`);
}

function testExtractUrlFromMarkdownWrapper() {
  const cases = [
    {
      input: '[https://example.com](https://example.com)',
      expected: 'https://example.com',
      name: 'symmetric markdown link',
    },
    {
      input: '[Display Text](https://example.com/page)',
      expected: 'https://example.com/page',
      name: 'labeled markdown link',
    },
    {
      input: 'https://plain-url.com',
      expected: 'https://plain-url.com',
      name: 'plain URL passthrough',
    },
    {
      input: '',
      expected: '',
      name: 'empty string',
    },
  ];

  let passed = 0;
  for (const c of cases) {
    const result = extractUrlFromMarkdownWrapper(c.input);
    if (result === c.expected) {
      passed++;
    } else {
      console.error(`FAIL [extractUrl - ${c.name}]:\n  expected: ${JSON.stringify(c.expected)}\n  got: ${JSON.stringify(result)}`);
    }
  }
  console.log(`extractUrlFromMarkdownWrapper: ${passed}/${cases.length} passed`);
}

function testEscapeMarkdownText() {
  const cases = [
    { input: 'Normal text', expected: 'Normal text', name: 'no-op' },
    { input: 'Has [brackets]', expected: 'Has \\[brackets\\]', name: 'brackets' },
    { input: 'Back\\slash', expected: 'Back\\\\slash', name: 'backslash' },
  ];

  let passed = 0;
  for (const c of cases) {
    const result = escapeMarkdownText(c.input);
    if (result === c.expected) {
      passed++;
    } else {
      console.error(`FAIL [escapeMarkdownText - ${c.name}]:\n  expected: ${JSON.stringify(c.expected)}\n  got: ${JSON.stringify(result)}`);
    }
  }
  console.log(`escapeMarkdownText: ${passed}/${cases.length} passed`);
}

function testRedactSensitiveParams() {
  const cases = [
    {
      input: 'https://example.com/page?token=abc123&page=2',
      expected: 'https://example.com/page?token=[REDACTED]&page=2',
      name: 'redacts token, preserves safe param',
    },
    {
      input: 'https://example.com/page?access_token=secret&q=search',
      expected: 'https://example.com/page?access_token=[REDACTED]&q=search',
      name: 'redacts access_token',
    },
    {
      input: 'https://example.com/page',
      expected: 'https://example.com/page',
      name: 'no query params',
    },
    {
      input: 'https://example.com?session=xyz123456789012345678901234567890123456789extra',
      expected: 'https://example.com?session=[REDACTED]',
      name: 'redacts session',
    },
    {
      input: 'https://example.com?unknown_param=averylongvaluethatisoversfortycharsandisunknownsoredacted',
      expected: 'https://example.com?unknown_param=[REDACTED]',
      name: 'redacts unknown long values',
    },
    {
      input: 'https://example.com?sfvrsn=aaa97081_2&utm_source=copilot.com',
      expected: 'https://example.com?sfvrsn=aaa97081_2&utm_source=copilot.com',
      name: 'preserves safe params (sfvrsn, utm_source)',
    },
  ];

  let passed = 0;
  for (const c of cases) {
    const result = redactSensitiveParams(c.input);
    if (result === c.expected) {
      passed++;
    } else {
      console.error(`FAIL [redactSensitiveParams - ${c.name}]:\n  expected: ${JSON.stringify(c.expected)}\n  got: ${JSON.stringify(result)}`);
    }
  }
  console.log(`redactSensitiveParams: ${passed}/${cases.length} passed`);
}

function testIsAlreadyEncoded() {
  const cases = [
    { input: 'hello%20world', expected: true, name: 'encoded space' },
    { input: 'file-%286-0%29.pdf', expected: true, name: 'encoded parens' },
    { input: 'normal-text', expected: false, name: 'no encoding' },
    { input: '100% complete', expected: false, name: 'percent sign not encoding' },
  ];

  let passed = 0;
  for (const c of cases) {
    const result = isAlreadyEncoded(c.input);
    if (result === c.expected) {
      passed++;
    } else {
      console.error(`FAIL [isAlreadyEncoded - ${c.name}]:\n  expected: ${c.expected}\n  got: ${result}`);
    }
  }
  console.log(`isAlreadyEncoded: ${passed}/${cases.length} passed`);
}

function testDecodeIfDoubleEncoded() {
  const cases = [
    { input: 'file-%2528test%2529.pdf', expected: 'file-%28test%29.pdf', name: 'fixes double-encoded' },
    { input: 'file-%28test%29.pdf', expected: 'file-%28test%29.pdf', name: 'no-op for single encoded' },
    { input: 'normal-text', expected: 'normal-text', name: 'no-op for plain text' },
  ];

  let passed = 0;
  for (const c of cases) {
    const result = decodeIfDoubleEncoded(c.input);
    if (result === c.expected) {
      passed++;
    } else {
      console.error(`FAIL [decodeIfDoubleEncoded - ${c.name}]:\n  expected: ${JSON.stringify(c.expected)}\n  got: ${JSON.stringify(result)}`);
    }
  }
  console.log(`decodeIfDoubleEncoded: ${passed}/${cases.length} passed`);
}

function testBuildMarkdownUrl() {
  const result = buildMarkdownUrl(
    'CompTIA A+ Objectives',
    '[https://comptiacdn.azureedge.net/.../comptia-a-220-1001-exam-objectives-(6-0).pdf?sfvrsn=aaa97081_2&utm_source=copilot.com](https://comptiacdn.azureedge.net/.../comptia-a-220-1001-exam-objectives-(6-0).pdf?sfvrsn=aaa97081_2&utm_source=copilot.com)'
  );

  const expectedUrl = 'https://comptiacdn.azureedge.net/.../comptia-a-220-1001-exam-objectives-%286-0%29.pdf?sfvrsn=aaa97081_2&utm_source=copilot.com';
  const passed = result.includes(expectedUrl) && result.startsWith('[') && result.includes('](');

  if (passed) {
    console.log('buildMarkdownUrl: 1/1 passed');
  } else {
    console.error(`FAIL [buildMarkdownUrl]:\n  got: ${result}\n  expected URL part: ${expectedUrl}`);
    console.log('buildMarkdownUrl: 0/1 passed');
  }
}

// ===========================================================================
// Run all tests
// ===========================================================================

export function runAllTests() {
  console.log('=== Tab Metadata & Markdown Links Test Suite ===\n');

  testStripWrapperTags();
  testParseRawTabsMetadata();
  testGenerateCleaningDiff();
  testEncodeMarkdownUrl();
  testExtractUrlFromMarkdownWrapper();
  testEscapeMarkdownText();
  testRedactSensitiveParams();
  testIsAlreadyEncoded();
  testDecodeIfDoubleEncoded();
  testBuildMarkdownUrl();

  console.log('\n=== Tests Complete ===');
}
