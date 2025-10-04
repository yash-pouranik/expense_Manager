const Expense = require('../models/Expense');
const ApprovalRule = require('../models/ApprovalRule');

async function checkApprovalRules(expense) {
    const rules = await ApprovalRule.findOne({ company: expense.company });
    if (!rules) return false; // no rules defined

    const totalApprovals = expense.approvalHistory.filter(h => h.status === 'Approved').length;
    const totalRejections = expense.approvalHistory.filter(h => h.status === 'Rejected').length;
    const totalVotes = expense.approvalHistory.length;

    if (rules.ruleType === 'percentage') {
        const percentage = (totalApprovals / totalVotes) * 100;
        return percentage >= rules.percentageThreshold;
    }

    if (rules.ruleType === 'specific') {
        return expense.approvalHistory.some(h => 
            rules.specificApprovers.map(String).includes(String(h.approver)) && h.status === 'Approved'
        );
    }

    if (rules.ruleType === 'hybrid') {
        const percentage = (totalApprovals / totalVotes) * 100;
        const specificApproved = expense.approvalHistory.some(h => 
            rules.specificApprovers.map(String).includes(String(h.approver)) && h.status === 'Approved'
        );
        return (percentage >= rules.percentageThreshold) || specificApproved;
    }

    return false;
}

// Inside handleApprovalAction after saving approval
if (await checkApprovalRules(expense)) {
    expense.status = 'Approved';
    await expense.save();
}
