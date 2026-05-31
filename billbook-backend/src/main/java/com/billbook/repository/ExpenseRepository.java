package com.billbook.repository;

import com.billbook.model.Expense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface ExpenseRepository extends JpaRepository<Expense, Long> {
    List<Expense> findByUserIdOrderByExpenseDateDesc(Long userId);
    List<Expense> findByUserIdAndCategoryOrderByExpenseDateDesc(Long userId, Expense.Category category);
    List<Expense> findByUserIdAndExpenseDateBetweenOrderByExpenseDateDesc(Long userId, LocalDate from, LocalDate to);

    @Query(value = "SELECT COALESCE(SUM(amount),0) FROM bb_expenses WHERE user_id=:userId AND expense_date BETWEEN :from AND :to", nativeQuery = true)
    BigDecimal totalExpensesBetween(Long userId, LocalDate from, LocalDate to);

    @Query(value = "SELECT COALESCE(SUM(amount),0) FROM bb_expenses WHERE user_id=:userId", nativeQuery = true)
    BigDecimal totalExpenses(Long userId);
}
