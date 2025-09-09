const fs = require('fs');
const path = require('path');
const assert = require('assert');

/**
 * Comprehensive Testing and Evaluation Framework for Chatbot
 * Tests performance across different query types and measures accuracy
 */

class ChatbotTester {
  constructor() {
    this.testResults = [];
    this.testSuites = [];
    this.metrics = {
      accuracy: 0,
      intentClassificationAccuracy: 0,
      responseQuality: 0,
      processingTime: 0,
      totalTests: 0,
      passedTests: 0,
      failedTests: 0
    };
    this.loadTestData();
  }

  // Load test datasets
  loadTestData() {
    try {
      // Load comprehensive test dataset
      const testDataPath = path.join(__dirname, '../training_data/comprehensive_dataset.json');
      if (fs.existsSync(testDataPath)) {
        const rawData = fs.readFileSync(testDataPath, 'utf8');
        const data = JSON.parse(rawData);
        this.testSuites.push({
          name: 'comprehensive_dataset',
          data: data.training_dataset.data,
          type: 'intent_classification'
        });
      }

      // Load custom test cases
      this.testSuites.push({
        name: 'custom_test_cases',
        data: this.getCustomTestCases(),
        type: 'functional'
      });

      // Load edge cases
      this.testSuites.push({
        name: 'edge_cases',
        data: this.getEdgeCases(),
        type: 'edge_case'
      });

      console.log(`Loaded ${this.testSuites.length} test suites`);
    } catch (error) {
      console.error('Error loading test data:', error);
    }
  }

  // Custom test cases for specific functionality
  getCustomTestCases() {
    return [
      {
        id: 'greeting_test_1',
        query: "Hello there!",
        expectedIntent: "greeting",
        expectedResponse: {
          type: "conversational",
          shouldContain: ["hello", "hi", "welcome", "elina"]
        },
        category: "greeting"
      },
      {
        id: 'book_rec_test_1',
        query: "Can you recommend some science fiction books?",
        expectedIntent: "book_recommendation",
        expectedResponse: {
          type: "informational",
          shouldContain: ["science", "fiction", "books", "recommend"]
        },
        category: "book_recommendation"
      },
      {
        id: 'donation_test_1',
        query: "How do I donate my old textbooks?",
        expectedIntent: "how_to_donate",
        expectedResponse: {
          type: "transactional",
          shouldContain: ["donate", "textbook", "add book", "steps"]
        },
        category: "donation"
      },
      {
        id: 'pickup_test_1',
        query: "I need a pickup tomorrow",
        expectedIntent: "pickup_request",
        expectedResponse: {
          type: "transactional", 
          shouldContain: ["pickup", "request", "tomorrow"]
        },
        category: "pickup"
      },
      {
        id: 'search_test_1',
        query: "Do you have any Harry Potter books?",
        expectedIntent: "book_search",
        expectedResponse: {
          type: "transactional",
          shouldContain: ["harry potter", "search", "books"]
        },
        category: "search"
      },
      {
        id: 'support_test_1',
        query: "I can't log in to my account",
        expectedIntent: "technical_support",
        expectedResponse: {
          type: "support",
          shouldContain: ["login", "password", "account", "help"]
        },
        category: "technical_support"
      }
    ];
  }

  // Edge cases and unusual inputs
  getEdgeCases() {
    return [
      {
        id: 'empty_test',
        query: "",
        expectedIntent: "general_inquiry",
        category: "edge_case"
      },
      {
        id: 'very_long_test',
        query: "I really really really really really really want to find some books that are interesting and engaging and fun to read and I don't know where to start looking for them can you help me please",
        expectedIntent: "book_recommendation",
        category: "edge_case"
      },
      {
        id: 'nonsense_test',
        query: "asdfgh qwerty zxcvbn",
        expectedIntent: "general_inquiry",
        category: "edge_case"
      },
      {
        id: 'mixed_language_test',
        query: "Hello, je voudrais des livres",
        expectedIntent: "greeting",
        category: "edge_case"
      },
      {
        id: 'special_chars_test',
        query: "What books do you have??? !!! @#$%",
        expectedIntent: "book_search",
        category: "edge_case"
      },
      {
        id: 'numbers_only_test',
        query: "123 456 789",
        expectedIntent: "general_inquiry",
        category: "edge_case"
      }
    ];
  }

  // Run all test suites
  async runAllTests(chatbotInstance) {
    console.log('Starting comprehensive chatbot tests...');
    console.log('=' * 50);

    const startTime = Date.now();
    this.testResults = [];

    for (const suite of this.testSuites) {
      console.log(`\nRunning ${suite.name} (${suite.data.length} tests)`);
      await this.runTestSuite(suite, chatbotInstance);
    }

    const endTime = Date.now();
    this.calculateMetrics();

    console.log('\n' + '=' * 50);
    console.log('TEST RESULTS SUMMARY');
    console.log('=' * 50);
    
    console.log(`Total Tests: ${this.metrics.totalTests}`);
    console.log(`Passed: ${this.metrics.passedTests}`);
    console.log(`Failed: ${this.metrics.failedTests}`);
    console.log(`Overall Accuracy: ${(this.metrics.accuracy * 100).toFixed(2)}%`);
    console.log(`Intent Classification Accuracy: ${(this.metrics.intentClassificationAccuracy * 100).toFixed(2)}%`);
    console.log(`Average Processing Time: ${this.metrics.processingTime}ms`);
    console.log(`Total Test Duration: ${endTime - startTime}ms`);

    // Generate detailed report
    this.generateTestReport();

    return this.metrics;
  }

  // Run individual test suite
  async runTestSuite(suite, chatbotInstance) {
    let passed = 0;
    let failed = 0;

    for (const testCase of suite.data) {
      const result = await this.runSingleTest(testCase, chatbotInstance, suite.type);
      
      if (result.passed) {
        passed++;
        process.stdout.write('✓');
      } else {
        failed++;
        process.stdout.write('✗');
      }

      this.testResults.push({
        suite: suite.name,
        testId: testCase.id || `test_${Date.now()}`,
        ...result
      });

      // Add small delay to prevent overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    console.log(`\n${suite.name}: ${passed} passed, ${failed} failed`);
  }

  // Run individual test
  async runSingleTest(testCase, chatbotInstance, suiteType) {
    const startTime = Date.now();
    
    try {
      const query = testCase.query;
      const expectedIntent = testCase.expectedIntent || testCase.intent;
      const expectedResponse = testCase.expectedResponse || testCase.response;

      // Get chatbot response
      const response = await chatbotInstance.processMessage('test_user', query);
      const processingTime = Date.now() - startTime;

      // Evaluate response
      const intentMatch = this.evaluateIntent(response.intent, expectedIntent);
      const responseQuality = this.evaluateResponse(response.reply, expectedResponse);
      const overallScore = (intentMatch + responseQuality) / 2;

      return {
        passed: overallScore >= 0.7, // 70% threshold for pass
        query: query,
        expectedIntent: expectedIntent,
        actualIntent: response.intent,
        expectedResponse: expectedResponse,
        actualResponse: response.reply,
        intentAccuracy: intentMatch,
        responseQuality: responseQuality,
        overallScore: overallScore,
        processingTime: processingTime,
        confidence: response.confidence || 0,
        category: testCase.category || 'unknown'
      };

    } catch (error) {
      return {
        passed: false,
        query: testCase.query,
        error: error.message,
        processingTime: Date.now() - startTime,
        category: testCase.category || 'unknown'
      };
    }
  }

  // Evaluate intent classification accuracy
  evaluateIntent(actualIntent, expectedIntent) {
    if (!expectedIntent) return 1; // Skip if no expected intent

    // Exact match
    if (actualIntent === expectedIntent) return 1;

    // Partial match for similar intents
    const intentSimilarity = this.calculateIntentSimilarity(actualIntent, expectedIntent);
    return intentSimilarity;
  }

  // Evaluate response quality
  evaluateResponse(actualResponse, expectedResponse) {
    if (!expectedResponse) return 0.5; // Default score if no expected response

    if (typeof expectedResponse === 'string') {
      return this.calculateTextSimilarity(actualResponse, expectedResponse);
    }

    if (typeof expectedResponse === 'object' && expectedResponse.shouldContain) {
      let score = 0;
      const keywords = expectedResponse.shouldContain;
      
      for (const keyword of keywords) {
        if (actualResponse.toLowerCase().includes(keyword.toLowerCase())) {
          score += 1;
        }
      }
      
      return Math.min(score / keywords.length, 1);
    }

    return 0.5; // Default score
  }

  // Calculate similarity between intents
  calculateIntentSimilarity(intent1, intent2) {
    const similarIntents = {
      'greeting': ['hello', 'hi', 'welcome'],
      'book_recommendation': ['recommend', 'suggest', 'book_rec'],
      'how_to_donate': ['donate', 'donation', 'give'],
      'pickup_request': ['pickup', 'collect', 'request'],
      'book_search': ['search', 'find', 'look']
    };

    // Check if intents are in the same similarity group
    for (const group of Object.values(similarIntents)) {
      if (group.includes(intent1) && group.includes(intent2)) {
        return 0.8; // High similarity
      }
    }

    return 0; // No similarity
  }

  // Calculate text similarity (simple word overlap)
  calculateTextSimilarity(text1, text2) {
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }

  // Calculate overall metrics
  calculateMetrics() {
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;

    const intentAccuracies = this.testResults
      .filter(r => r.intentAccuracy !== undefined)
      .map(r => r.intentAccuracy);

    const responseQualities = this.testResults
      .filter(r => r.responseQuality !== undefined)
      .map(r => r.responseQuality);

    const processingTimes = this.testResults
      .filter(r => r.processingTime !== undefined)
      .map(r => r.processingTime);

    this.metrics = {
      totalTests,
      passedTests,
      failedTests,
      accuracy: passedTests / totalTests,
      intentClassificationAccuracy: intentAccuracies.length > 0 
        ? intentAccuracies.reduce((a, b) => a + b, 0) / intentAccuracies.length 
        : 0,
      responseQuality: responseQualities.length > 0 
        ? responseQualities.reduce((a, b) => a + b, 0) / responseQualities.length 
        : 0,
      processingTime: processingTimes.length > 0 
        ? Math.round(processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length)
        : 0
    };
  }

  // Generate detailed test report
  generateTestReport() {
    const report = {
      timestamp: new Date().toISOString(),
      metrics: this.metrics,
      testResults: this.testResults,
      categoryBreakdown: this.getCategoryBreakdown(),
      failedTests: this.testResults.filter(r => !r.passed),
      recommendations: this.generateRecommendations()
    };

    // Save report
    const reportsDir = path.join(__dirname, 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const reportPath = path.join(reportsDir, `test_report_${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log(`\nDetailed test report saved to: ${reportPath}`);

    // Generate human-readable report
    this.generateHumanReadableReport(report);
  }

  // Get breakdown by category
  getCategoryBreakdown() {
    const breakdown = {};
    
    for (const result of this.testResults) {
      const category = result.category || 'unknown';
      
      if (!breakdown[category]) {
        breakdown[category] = {
          total: 0,
          passed: 0,
          failed: 0,
          accuracy: 0
        };
      }
      
      breakdown[category].total++;
      if (result.passed) {
        breakdown[category].passed++;
      } else {
        breakdown[category].failed++;
      }
      
      breakdown[category].accuracy = breakdown[category].passed / breakdown[category].total;
    }
    
    return breakdown;
  }

  // Generate recommendations for improvement
  generateRecommendations() {
    const recommendations = [];
    
    // Check overall accuracy
    if (this.metrics.accuracy < 0.8) {
      recommendations.push("Overall accuracy is below 80%. Consider expanding training data.");
    }
    
    // Check intent classification
    if (this.metrics.intentClassificationAccuracy < 0.85) {
      recommendations.push("Intent classification needs improvement. Review training data and add more examples.");
    }
    
    // Check processing time
    if (this.metrics.processingTime > 1000) {
      recommendations.push("Processing time is high. Consider optimizing the chatbot engine.");
    }
    
    // Check category-specific issues
    const categoryBreakdown = this.getCategoryBreakdown();
    for (const [category, stats] of Object.entries(categoryBreakdown)) {
      if (stats.accuracy < 0.7) {
        recommendations.push(`${category} category has low accuracy (${(stats.accuracy * 100).toFixed(1)}%). Add more training examples.`);
      }
    }
    
    // Check failed tests
    const failedTests = this.testResults.filter(r => !r.passed);
    if (failedTests.length > 0) {
      const commonFailures = {};
      failedTests.forEach(test => {
        const key = test.category || 'unknown';
        commonFailures[key] = (commonFailures[key] || 0) + 1;
      });
      
      const topFailure = Object.keys(commonFailures).reduce((a, b) => 
        commonFailures[a] > commonFailures[b] ? a : b
      );
      
      recommendations.push(`Most common failure category: ${topFailure}. Focus improvement efforts here.`);
    }
    
    if (recommendations.length === 0) {
      recommendations.push("Chatbot performance looks good! Continue monitoring and testing.");
    }
    
    return recommendations;
  }

  // Generate human-readable report
  generateHumanReadableReport(report) {
    const readableReportPath = path.join(__dirname, 'reports', `test_summary_${Date.now()}.md`);
    
    let content = `# Chatbot Test Report\n\n`;
    content += `**Generated:** ${new Date(report.timestamp).toLocaleString()}\n\n`;
    
    content += `## Summary\n\n`;
    content += `- **Total Tests:** ${report.metrics.totalTests}\n`;
    content += `- **Passed:** ${report.metrics.passedTests}\n`;
    content += `- **Failed:** ${report.metrics.failedTests}\n`;
    content += `- **Overall Accuracy:** ${(report.metrics.accuracy * 100).toFixed(2)}%\n`;
    content += `- **Intent Classification Accuracy:** ${(report.metrics.intentClassificationAccuracy * 100).toFixed(2)}%\n`;
    content += `- **Average Processing Time:** ${report.metrics.processingTime}ms\n\n`;
    
    content += `## Category Breakdown\n\n`;
    for (const [category, stats] of Object.entries(report.categoryBreakdown)) {
      content += `### ${category}\n`;
      content += `- Tests: ${stats.total}\n`;
      content += `- Passed: ${stats.passed}\n`;
      content += `- Failed: ${stats.failed}\n`;
      content += `- Accuracy: ${(stats.accuracy * 100).toFixed(2)}%\n\n`;
    }
    
    content += `## Recommendations\n\n`;
    report.recommendations.forEach((rec, i) => {
      content += `${i + 1}. ${rec}\n`;
    });
    
    if (report.failedTests.length > 0) {
      content += `\n## Failed Tests Sample\n\n`;
      report.failedTests.slice(0, 5).forEach((test, i) => {
        content += `### Failed Test ${i + 1}\n`;
        content += `- **Query:** ${test.query}\n`;
        content += `- **Expected Intent:** ${test.expectedIntent}\n`;
        content += `- **Actual Intent:** ${test.actualIntent}\n`;
        content += `- **Category:** ${test.category}\n\n`;
      });
    }
    
    fs.writeFileSync(readableReportPath, content);
    console.log(`Human-readable report saved to: ${readableReportPath}`);
  }

  // Performance benchmark
  async runPerformanceBenchmark(chatbotInstance, testCount = 100) {
    console.log(`Running performance benchmark with ${testCount} tests...`);
    
    const testQueries = [
      "Hello!",
      "Can you recommend some books?",
      "How do I donate books?",
      "I need a pickup",
      "Do you have Harry Potter?",
      "My login isn't working"
    ];
    
    const startTime = Date.now();
    const processingTimes = [];
    
    for (let i = 0; i < testCount; i++) {
      const query = testQueries[i % testQueries.length];
      const testStart = Date.now();
      
      await chatbotInstance.processMessage('benchmark_user', query);
      
      processingTimes.push(Date.now() - testStart);
    }
    
    const totalTime = Date.now() - startTime;
    const avgProcessingTime = processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length;
    const minTime = Math.min(...processingTimes);
    const maxTime = Math.max(...processingTimes);
    
    console.log('\nPerformance Benchmark Results:');
    console.log(`Total Tests: ${testCount}`);
    console.log(`Total Time: ${totalTime}ms`);
    console.log(`Average Processing Time: ${avgProcessingTime.toFixed(2)}ms`);
    console.log(`Min Processing Time: ${minTime}ms`);
    console.log(`Max Processing Time: ${maxTime}ms`);
    console.log(`Queries per Second: ${(testCount / (totalTime / 1000)).toFixed(2)}`);
    
    return {
      totalTests: testCount,
      totalTime,
      avgProcessingTime,
      minTime,
      maxTime,
      queriesPerSecond: testCount / (totalTime / 1000)
    };
  }
}

module.exports = ChatbotTester;
