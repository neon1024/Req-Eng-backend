module.exports = {
    default: {
        requireModule: ['ts-node/register'],
        require: ['features/step-definitions/**/*.ts', 'features/support/**/*.ts'],
        paths: ['features/**/*.feature'],
        format: ['progress', 'html:reports/cucumber-report.html'],
        formatOptions: { snippetInterface: 'async-await' }
    }
};
